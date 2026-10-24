import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { prisma, isDatabaseConfigured } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "d32_store_jwt_secret_key_production_secure_2026";

// Global Rate Limiting
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { error: "Too many requests, please try again later." },
});

// Specific Auth Rate Limiting
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: "Too many authentication attempts. Please try again later." },
});

// Specific Verification Code Limiting
export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification code attempts. Please wait 15 minutes." },
});

// Helper for database error responses
export function handleDbError(
  res: express.Response,
  err: any,
  defaultMessage = "Service temporarily unavailable"
) {
  console.error("[Database Error]:", err);
  return res.status(503).json({
    error: defaultMessage,
    code: 503,
  });
}

// Database requirement middleware
export function requireDatabase(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!isDatabaseConfigured()) {
    return res.status(503).json({
      error: "Service temporarily unavailable. Database connection is not configured.",
    });
  }
  next();
}

/**
 * Resolves verified caller ID from request headers using signed JWT tokens or session verification
 */
export async function getVerifiedCaller(req: express.Request): Promise<{
  userId: string;
  role: "admin" | "customer";
  username: string;
  email?: string;
} | null> {
  // Check Authorization header for Bearer JWT token
  const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-auth-token"]) {
    token = (req.headers["x-auth-token"] as string).trim();
  }

  // 1. Verify Signed JWT Token
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.userId) {
        if (isDatabaseConfigured()) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { userId: decoded.userId },
                { id: decoded.userId },
                { email: decoded.email || "" },
              ],
            },
          });

          if (user && user.status !== "Banned") {
            return {
              userId: user.userId || user.id,
              role: user.role as "admin" | "customer",
              username: user.username,
              email: user.email || undefined,
            };
          }
        } else {
          return {
            userId: decoded.userId,
            role: decoded.role || "customer",
            username: decoded.username || decoded.userId,
            email: decoded.email,
          };
        }
      }
    } catch {
      // JWT token expired or invalid signature
    }
  }

  return null;
}

// Admin privileges requirement middleware
export async function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }

  if (caller.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Administrator privileges required." });
  }

  (req as any).user = caller;
  next();
}

// Owner or Admin check for user-specific data isolation
export async function requireOwnerOrAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }

  const targetUserId = (req.query.userId || req.body.userId || req.params.userId) as string;

  // Admins can access any user's records
  if (caller.role === "admin") {
    (req as any).user = caller;
    return next();
  }

  // Customers can ONLY access their own records
  if (!targetUserId || targetUserId === caller.userId || targetUserId === caller.username) {
    (req as any).user = caller;
    return next();
  }

  return res.status(403).json({
    error: "Access denied. You can only access your own information.",
  });
}
