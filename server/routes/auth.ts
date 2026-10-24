import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { authLimiter, verifyCodeLimiter, handleDbError, requireOwnerOrAdmin, getVerifiedCaller } from "../middleware.js";
import { sendEmailVerificationCode, verifyEmailCode } from "../services/verification.js";
import { getUserWallet, getUserWalletTransactions } from "../services/wallet.js";

const JWT_SECRET = process.env.JWT_SECRET || "d32_store_jwt_secret_key_production_secure_2026";

const router = Router();

function cleanUsername(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 32);
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "your email";
  const [name, domain] = email.split("@");
  const visible = name.length <= 2 ? name[0] + "***" : name[0] + "***" + name[name.length - 1];
  return `${visible}@${domain}`;
}

// POST /api/auth/send-code (Sends 6-digit verification code via Resend)
router.post("/send-code", verifyCodeLimiter, async (req, res) => {
  const { email, type = "signup" } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const validTypes = ["signup", "guest_checkout", "login", "two_factor_auth"];
  const codeType = validTypes.includes(type) ? type : "signup";

  // If signup, check if email is already registered
  if (codeType === "signup") {
    const existing = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({
        error: "An account with this email address already exists. Please log in.",
      });
    }
  }

  const result = await sendEmailVerificationCode(email, codeType as any);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Plain code is NEVER returned in response
  return res.json({
    success: true,
    message: result.message,
  });
});

// POST /api/auth/verify-code
router.post("/verify-code", verifyCodeLimiter, async (req, res) => {
  const { email, code, type = "signup", termsAccepted, policyVersion = "2026.1" } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and 6-digit code are required." });
  }

  const result = await verifyEmailCode(email, code, type);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // If terms were accepted, persist acceptance in PolicyAcceptance table
  if (termsAccepted) {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      await prisma.policyAcceptance.create({
        data: {
          email: email.trim().toLowerCase(),
          termsOfService: true,
          privacyPolicy: true,
          refundPolicy: true,
          digitalGoodsPolicy: true,
          policyVersion: String(policyVersion),
          ipAddress: ip.substring(0, 100),
          userAgent: userAgent.substring(0, 255),
        },
      });
    } catch (err) {
      console.warn("[PolicyAcceptance] Failed to store record:", err);
    }
  }

  return res.json({
    success: true,
    verified: true,
    guestAccessToken: result.guestAccessToken || null,
  });
});

// POST /api/auth/register (Create account with email verification & policy acceptance)
router.post("/register", authLimiter, async (req, res) => {
  const {
    email,
    password,
    username,
    verificationCode,
    termsAccepted,
    privacyPolicyAccepted,
    refundPolicyAccepted,
    digitalGoodsPolicyAccepted,
    policyVersion = "2026.1",
  } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Email, username, and password are required." });
  }

  // Enforce mandatory policy agreements per store rules
  if (!termsAccepted || !privacyPolicyAccepted || !refundPolicyAccepted || !digitalGoodsPolicyAccepted) {
    return res.status(400).json({
      error: "You must agree to the Terms of Service, Privacy Policy, Refund Policy, and Digital Goods Policy to create an account.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const uName = cleanUsername(username);

  if (uName.length < 2 || uName.length > 32) {
    return res.status(400).json({ error: "Username must be between 2 and 32 characters." });
  }

  try {
    // Check if email already taken
    const existingEmail = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingEmail) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Check if username taken
    const existingName = await prisma.user.findFirst({ where: { username: uName } });
    if (existingName) {
      return res.status(400).json({ error: "Username is already taken. Please choose another." });
    }

    // Require email verification code before creating account to securely verify email ownership
    if (!verificationCode || String(verificationCode).trim().length !== 6) {
      return res.status(400).json({
        error: "A valid 6-digit email verification code is required to register and verify account ownership.",
      });
    }

    const vResult = await verifyEmailCode(cleanEmail, verificationCode, "signup");
    if (!vResult.success) {
      return res.status(400).json({ error: vResult.error || "Invalid or expired verification code." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    // Transaction to create user, initial wallet, and policy acceptance
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          username: uName,
          role: "customer",
          authProvider: "Email",
          status: "Active",
        },
      });

      // Create user wallet with $0.00
      await tx.wallet.create({
        data: {
          userId: u.userId,
          balance: 0.0,
        },
      });

      // Store policy acceptance with timestamp and version
      await tx.policyAcceptance.create({
        data: {
          userId: u.userId,
          email: cleanEmail,
          termsOfService: true,
          privacyPolicy: true,
          refundPolicy: true,
          digitalGoodsPolicy: true,
          policyVersion: String(policyVersion),
          ipAddress: ip.substring(0, 100),
          userAgent: userAgent.substring(0, 255),
        },
      });

      // Securely associate eligible previous guest orders with the newly created verified account
      try {
        const linkedOrders = await tx.order.updateMany({
          where: {
            guestEmail: cleanEmail,
            userId: "guest",
          },
          data: {
            userId: u.userId,
          },
        });
        if (linkedOrders.count > 0) {
          console.log(`[Registration] Associated ${linkedOrders.count} verified guest orders for ${cleanEmail}`);
        }

        // Also associate any guest support tickets opened with this email
        await tx.ticket.updateMany({
          where: {
            customerEmail: cleanEmail,
            userId: "guest",
          },
          data: {
            userId: u.userId,
          },
        });
      } catch (linkErr) {
        console.warn("[Registration] Linking guest orders warning:", linkErr);
      }

      return u;
    });

    const token = jwt.sign(
      {
        userId: newUser.userId || newUser.id,
        role: newUser.role,
        email: newUser.email,
        username: newUser.username,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      user: {
        id: newUser.userId || newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.username,
        role: newUser.role,
        twoFactorEnabled: false,
      },
      token,
    });
  } catch (err) {
    return handleDbError(res, err, "Registration failed");
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const lookup = email.trim();

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: lookup.toLowerCase() }, { username: lookup }],
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.status === "Banned") {
      return res.status(403).json({ error: "Your account is disabled. Please contact support." });
    }

    // Two-Factor Authentication Check
    if (user.twoFactorEnabled && user.email) {
      const challengeToken = jwt.sign(
        {
          userId: user.userId || user.id,
          action: "2fa_challenge",
        },
        JWT_SECRET,
        { expiresIn: "10m" }
      );

      const codeResult = await sendEmailVerificationCode(user.email, "two_factor_auth");
      if (!codeResult.success) {
        return res.status(500).json({
          error: "Failed to dispatch 2FA verification email. Please try again or use recovery codes.",
        });
      }

      return res.json({
        twoFactorRequired: true,
        challengeToken,
        emailMasked: maskEmail(user.email),
        message: `Two-factor verification code dispatched to ${maskEmail(user.email)}`,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      {
        userId: user.userId || user.id,
        role: user.role,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      user: {
        id: user.userId || user.id,
        email: user.email,
        username: user.username,
        name: user.username,
        role: user.role,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      },
      token,
    });
  } catch (err) {
    return handleDbError(res, err, "Login failed");
  }
});

// POST /api/auth/2fa/verify-login (Completes 2FA login via email OTP or single-use recovery code)
router.post("/2fa/verify-login", authLimiter, async (req, res) => {
  const { challengeToken, code } = req.body;
  if (!challengeToken || !code) {
    return res.status(400).json({ error: "Challenge token and 6-digit code or recovery code are required." });
  }

  try {
    const decoded = jwt.verify(challengeToken, JWT_SECRET) as any;
    if (!decoded || decoded.action !== "2fa_challenge" || !decoded.userId) {
      return res.status(401).json({ error: "2FA challenge has expired or is invalid. Please log in again." });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: decoded.userId }, { id: decoded.userId }],
      },
    });

    if (!user || user.status === "Banned") {
      return res.status(403).json({ error: "User account unavailable." });
    }

    const cleanInputCode = code.trim().toUpperCase().replace(/\s+/g, "");

    // 1. Check if user provided one of their recovery codes
    const recoveryIndex = (user.twoFactorRecoveryCodes || []).findIndex(
      (c) => c.toUpperCase().replace(/-/g, "") === cleanInputCode.replace(/-/g, "")
    );

    if (recoveryIndex !== -1) {
      // Consume the single-use recovery code
      const updatedCodes = [...user.twoFactorRecoveryCodes];
      updatedCodes.splice(recoveryIndex, 1);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorRecoveryCodes: updatedCodes,
          lastLogin: new Date(),
        },
      });

      console.log(`[2FA] User ${user.username} logged in with backup recovery code. ${updatedCodes.length} remaining.`);
    } else {
      // 2. Verify standard 6-digit email OTP
      if (!user.email) {
        return res.status(400).json({ error: "No email associated with this account." });
      }

      const vResult = await verifyEmailCode(user.email, code, "two_factor_auth");
      if (!vResult.success) {
        return res.status(400).json({ error: vResult.error || "Invalid 2FA verification code." });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    }

    const token = jwt.sign(
      {
        userId: user.userId || user.id,
        role: user.role,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      user: {
        id: user.userId || user.id,
        email: user.email,
        username: user.username,
        name: user.username,
        role: user.role,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      },
      token,
    });
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "2FA challenge expired. Please log in again." });
    }
    return handleDbError(res, err, "2FA verification failed");
  }
});

// POST /api/auth/2fa/request-enable (Sends email OTP to verify before enabling 2FA)
router.post("/2fa/request-enable", verifyCodeLimiter, async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ userId: caller.userId }, { id: caller.userId }] },
  });

  if (!user || !user.email) {
    return res.status(400).json({ error: "A verified email address is required to activate Two-Factor Authentication." });
  }

  const result = await sendEmailVerificationCode(user.email, "two_factor_auth");
  if (!result.success) {
    return res.status(400).json({ error: result.error || "Failed to dispatch verification email." });
  }

  return res.json({
    success: true,
    message: `Verification code sent to ${maskEmail(user.email)}.`,
  });
});

// POST /api/auth/2fa/confirm-enable (Verifies OTP, activates 2FA, generates single-use recovery codes)
router.post("/2fa/confirm-enable", verifyCodeLimiter, async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { code } = req.body;
  if (!code || code.trim().length !== 6) {
    return res.status(400).json({ error: "Please enter the complete 6-digit verification code." });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ userId: caller.userId }, { id: caller.userId }] },
  });

  if (!user || !user.email) {
    return res.status(400).json({ error: "User email not found." });
  }

  const vResult = await verifyEmailCode(user.email, code.trim(), "two_factor_auth");
  if (!vResult.success) {
    return res.status(400).json({ error: vResult.error || "Invalid verification code." });
  }

  // Generate 8 unique backup recovery codes (format: ABCD-EFGH)
  const recoveryCodes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase();
    recoveryCodes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorRecoveryCodes: recoveryCodes,
    },
  });

  return res.json({
    success: true,
    twoFactorEnabled: true,
    recoveryCodes,
    message: "Two-Factor Authentication is now active on your account!",
  });
});

// POST /api/auth/2fa/disable (Disables 2FA with password confirmation or verification code)
router.post("/2fa/disable", authLimiter, async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { password, code } = req.body;
  const user = await prisma.user.findFirst({
    where: { OR: [{ userId: caller.userId }, { id: caller.userId }] },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let authorized = false;
  if (password && user.password) {
    authorized = await bcrypt.compare(password, user.password);
  } else if (code && user.email) {
    const vResult = await verifyEmailCode(user.email, code.trim(), "two_factor_auth");
    authorized = vResult.success;
  }

  if (!authorized) {
    return res.status(400).json({ error: "Incorrect password or verification code to disable 2FA." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorRecoveryCodes: [],
    },
  });

  return res.json({
    success: true,
    twoFactorEnabled: false,
    message: "Two-Factor Authentication has been disabled.",
  });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Session unauthenticated" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: caller.userId }, { id: caller.userId }, { username: caller.username }],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User session not found" });
    }

    if (user.status === "Banned") {
      return res.status(403).json({ error: "Account disabled" });
    }

    return res.json({
      user: {
        id: user.userId || user.id,
        email: user.email,
        username: user.username,
        name: user.username,
        role: user.role,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      },
    });
  } catch (err) {
    return handleDbError(res, err, "Session verification temporarily unavailable");
  }
});

// GET /api/auth/wallet (Gets customer wallet balance and transactions)
router.get("/wallet", async (req, res) => {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const wallet = await getUserWallet(caller.userId);
    const transactions = await getUserWalletTransactions(caller.userId);

    return res.json({
      balance: wallet?.balance || 0.0,
      currency: "USD",
      transactions: transactions || [],
      updatedAt: wallet?.updatedAt || new Date(),
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to load wallet data");
  }
});

export default router;
