import crypto from "crypto";
import { prisma, isDatabaseConfigured } from "../db.js";
import { sendVerificationCodeEmail } from "./email.js";

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function generateCryptoCode(): string {
  // Cryptographically secure 6-digit integer
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

export function generateSecureAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generates, hashes, stores, and emails a verification code via Resend
 */
export async function sendEmailVerificationCode(
  email: string,
  type: "signup" | "guest_checkout" | "login" | "two_factor_auth"
): Promise<{ success: boolean; error?: string; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }

  // Rate limit: check recent codes created in the last 60 seconds
  if (isDatabaseConfigured()) {
    try {
      const recent = await prisma.emailVerificationCode.findFirst({
        where: {
          email: cleanEmail,
          createdAt: { gt: new Date(Date.now() - 45 * 1000) },
        },
      });
      if (recent) {
        return {
          success: false,
          error: "Please wait 45 seconds before requesting another verification code.",
        };
      }
    } catch (e) {
      console.warn("[Verification Service] Rate limit check warning:", e);
    }
  }

  const plainCode = generateCryptoCode();
  const codeHash = hashVerificationCode(plainCode);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  // Dispatch email via Resend
  const emailResult = await sendVerificationCodeEmail(cleanEmail, plainCode, type);
  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error || "Failed to deliver email through Resend.",
    };
  }

  // Persist hashed code in database
  if (isDatabaseConfigured()) {
    try {
      // Invalidate existing unverified codes for this email and type
      await prisma.emailVerificationCode.deleteMany({
        where: { email: cleanEmail, type },
      });

      await prisma.emailVerificationCode.create({
        data: {
          email: cleanEmail,
          codeHash,
          type,
          attempts: 0,
          verified: false,
          expiresAt,
        },
      });
    } catch (err: any) {
      console.error("[Verification Service] Failed to store code hash:", err);
      return { success: false, error: "Database error preparing verification code." };
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
  };
}

/**
 * Server-side verification of code against hash
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  type: "signup" | "guest_checkout" | "login" | "two_factor_auth"
): Promise<{ success: boolean; error?: string; guestAccessToken?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = (code || "").trim();

  if (!cleanEmail || !cleanCode || cleanCode.length !== 6) {
    return { success: false, error: "Please enter the complete 6-digit verification code." };
  }

  if (!isDatabaseConfigured()) {
    return { success: false, error: "Database not connected." };
  }

  try {
    const record = await prisma.emailVerificationCode.findFirst({
      where: {
        email: cleanEmail,
        type,
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return {
        success: false,
        error: "No active verification code found for this email. Please request a new one.",
      };
    }

    if (new Date() > record.expiresAt) {
      return {
        success: false,
        error: "Verification code has expired. Please request a new one.",
      };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a fresh verification code.",
      };
    }

    const inputHash = hashVerificationCode(cleanCode);
    if (inputHash !== record.codeHash) {
      await prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return {
        success: false,
        error: `Incorrect verification code. ${remaining} attempts remaining.`,
      };
    }

    // Code is valid! Mark as verified
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Generate secure guest token for guest checkout access
    const guestAccessToken = generateSecureAccessToken();

    return {
      success: true,
      guestAccessToken,
    };
  } catch (err: any) {
    console.error("[Verification Service] Verification error:", err);
    return { success: false, error: "Server error verifying code." };
  }
}
