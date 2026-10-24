import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcrypt";
import {
  prisma,
  connectDB,
  isDatabaseConfigured,
  checkDatabaseHealth,
} from "./server/db.js";

// Import Middlewares
import { globalLimiter } from "./server/middleware.js";

// Import Route Handlers
import authRouter from "./server/routes/auth.js";
import usersRouter from "./server/routes/users.js";
import catalogRouter from "./server/routes/catalog.js";
import ordersRouter from "./server/routes/orders.js";
import paymentRouter from "./server/routes/payment.js";
import ticketsRouter from "./server/routes/tickets.js";
import settingsRouter from "./server/routes/settings.js";
import adminRouter from "./server/routes/admin.js";

const app = express();
const PORT = 3000;

// Trust proxy required for secure cookies and rate limiting behind Cloudflare/reverse proxies
app.set("trust proxy", 1);

// Disable X-Powered-By header to prevent fingerprinting
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "sameorigin" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

const allowedOrigins = [
  "https://d32.store",
  "https://www.d32.store",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".d32.store") ||
        origin.includes("aistudio-hub") ||
        origin.includes("googleusercontent.com") ||
        origin.includes("web.app") ||
        origin.includes("firebaseapp.com")
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

// Parse JSON and store raw buffer for webhook HMAC verification
app.use(
  express.json({
    limit: "2mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// Apply global rate limiting across all API routes
app.use("/api", globalLimiter);

// Mount Modular API Routers
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api", catalogRouter);
app.use("/api", ordersRouter);
app.use("/api", paymentRouter);
app.use("/api", ticketsRouter);
app.use("/api", settingsRouter);
app.use("/api", adminRouter);

// Catch-all for undefined API routes
app.all("/api*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found`, code: 404 });
});

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler caught:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || err.statusCode || 500).json({
      error: "Internal Server Error",
      code: err.status || err.statusCode || 500,
      requestId: Date.now().toString(),
    });
  },
);

// SEEDER FOR POSTGRESQL VIA PRISMA
async function seedDatabaseIfEmpty() {
  if (!isDatabaseConfigured()) return;
  try {
    const health = await checkDatabaseHealth();
    if (!health.connected) return;

    // 1. Seed Users First
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("[Seeder] PostgreSQL user table is empty. Seeding default admin users via Prisma...");
      const defaultAdminPassword = await bcrypt.hash("admin123", 10);
      const seedUsers = [
        {
          userId: "1",
          username: "saleh",
          email: "s3lehsmain@gmail.com",
          password: defaultAdminPassword,
          role: "admin" as const,
          authProvider: "Email" as const,
          status: "Active" as const,
        },
        {
          userId: "3",
          username: "swiftsba",
          email: "swiftsba@gmail.com",
          password: defaultAdminPassword,
          role: "admin" as const,
          authProvider: "Email" as const,
          status: "Active" as const,
        },
      ];
      for (const u of seedUsers) {
        try {
          await prisma.user.create({ data: u });
        } catch (e) {}
      }
      console.log(`[Seeder] Successfully seeded default admin users.`);
    }

    // Ensure guest user exists for order foreign key constraint
    try {
      await prisma.user.upsert({
        where: { username: "guest" },
        create: {
          userId: "guest",
          username: "guest",
          email: "guest@d32.store",
          role: "customer",
          authProvider: "Email",
          status: "Active",
        },
        update: {},
      });
    } catch (e) {
      console.warn("[Seeder] Guest user check:", e);
    }

    // 2. Seed Products
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log("[Seeder] PostgreSQL product table is empty. Seeding default products via Prisma...");
      const seedProducts = [
        {
          productId: "1",
          name: "D32 Prime License",
          description: "Lifetime activation key. Lifetime access to D32 Prime with all premium features.",
          category: "DIGITAL",
          price: 499.0,
          stock: -1,
          image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1600",
        },
        {
          productId: "2",
          name: "D32 Pro — Monthly",
          description: "30-day recurring license. Monthly access with full Discord integration.",
          category: "DIGITAL",
          price: 49.0,
          stock: -1,
          image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1600",
        },
      ];
      for (const p of seedProducts) {
        try {
          await prisma.product.create({ data: p });
        } catch (e) {}
      }
      console.log(`[Seeder] Successfully seeded products.`);
    }

    // 3. Seed Reviews
    const reviewCount = await prisma.review.count();
    if (reviewCount === 0) {
      console.log("[Seeder] PostgreSQL review table is empty. Seeding default reviews via Prisma...");
      const seedReviews = [
        {
          reviewId: "r1",
          productId: "1",
          userId: "1",
          username: "@saleh",
          displayName: "Saleh",
          globalName: "Saleh",
          discordId: "123456789",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
          profileUpdatedAt: new Date(),
          rating: 5,
          reviewText: "Incredible speed and reliable service. 10/10!",
          approvalStatus: "Approved" as const,
          isVerifiedPurchase: true,
          isDiscordVerified: true,
          productName: "D32 Prime License",
          source: "DiscordBot",
          reported: false,
          images: [],
        },
        {
          reviewId: "r2",
          productId: "1",
          userId: "3",
          username: "@laylar",
          displayName: "Layla R.",
          globalName: "Layla",
          discordId: "987654321",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
          profileUpdatedAt: new Date(),
          rating: 5,
          reviewText: "Instant delivery and seamless activation. Super satisfied!",
          approvalStatus: "Approved" as const,
          isVerifiedPurchase: true,
          isDiscordVerified: true,
          productName: "D32 Prime License",
          source: "DiscordBot",
          reported: false,
          images: [],
        },
      ];
      for (const r of seedReviews) {
        try {
          await prisma.review.create({ data: r });
        } catch (e) {}
      }
      console.log(`[Seeder] Successfully seeded reviews.`);
    }
  } catch (error) {
    console.error("[Seeder] Error during Prisma database seeding:", error);
  }
}

async function startServer() {
  await connectDB();
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}`);
  });
}

startServer();
