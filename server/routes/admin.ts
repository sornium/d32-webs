import { Router } from "express";
import { prisma, checkDatabaseHealth } from "../db.js";
import { getAllTickets } from "../services/tickets.js";
import { handleDbError, requireAdmin, requireOwnerOrAdmin } from "../middleware.js";
import { creditUserWallet } from "../services/wallet.js";

const router = Router();

function cleanUsername(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 32);
}

// GET /api/db-status
router.get("/db-status", async (req, res) => {
  const health = await checkDatabaseHealth();
  if (health.error) {
    console.warn("[DB Health Check]:", health.error);
  }
  res.json({
    configured: health.configured,
    connected: health.connected,
    latencyMs: health.latencyMs,
    error: health.error ? "Database connection unavailable" : null,
    engine: "Prisma (PostgreSQL/Neon)",
  });
});

// GET /api/admin/db-diagnostics
router.get("/admin/db-diagnostics", requireAdmin, async (req, res) => {
  const health = await checkDatabaseHealth();
  const rawUrl = process.env.DATABASE_URL || "";
  const maskedUri = rawUrl
    ? "postgresql://***:******@protected-cluster/d32store (Secured Server-Side)"
    : "Not Configured";

  res.json({
    configured: health.configured,
    maskedUri,
    readyState: health.connected ? 1 : 0,
    status: health.connected ? "Connected" : "Disconnected",
    latencyMs: health.latencyMs,
    host: "PostgreSQL Serverless Cluster (Secured)",
    error: health.error ? "Database error occurred (logged securely)" : null,
    remoteError: null,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/admin/db-test-connection
router.post("/admin/db-test-connection", requireAdmin, async (req, res) => {
  const health = await checkDatabaseHealth();
  if (health.connected) {
    return res.json({
      success: true,
      latencyMs: health.latencyMs,
      message: "Direct PostgreSQL / Neon ping check via Prisma successful!",
      details: {
        engine: "Prisma Client (v7)",
        provider: "postgresql",
        ping: "SELECT 1 succeeded",
      },
    });
  } else {
    return res.json({
      success: false,
      latencyMs: health.latencyMs,
      error: health.error || "Connection failed or timed out",
      name: "PostgresConnectionError",
      tip: "Please verify that DATABASE_URL and DIRECT_URL are set to your Neon PostgreSQL connection strings.",
      rawErrorLog: {
        message: health.error,
      },
    });
  }
});

// GET /api/health
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ADMIN USER MANAGEMENT
router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        username: true,
        email: true,
        role: true,
        authProvider: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
    });
    return res.json(users);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch users");
  }
});

router.put("/admin/users/:id/status", requireAdmin, async (req, res) => {
  try {
    const target = await prisma.user.findFirst({
      where: { OR: [{ userId: req.params.id }, { id: req.params.id }] },
    });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { status: req.body.status === "Banned" ? "Banned" : "Active" },
    });
    return res.json(updated);
  } catch (err) {
    return handleDbError(res, err, "Failed to update user status");
  }
});

router.put("/admin/users/:id/username", requireAdmin, async (req, res) => {
  const sanitized = cleanUsername(req.body.username);
  try {
    const target = await prisma.user.findFirst({
      where: { OR: [{ userId: req.params.id }, { id: req.params.id }] },
    });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { username: sanitized },
    });
    return res.json(updated);
  } catch (err) {
    return handleDbError(res, err, "Failed to update username");
  }
});

// ADMIN REVIEWS
router.get("/admin/reviews", requireAdmin, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(reviews);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch admin reviews");
  }
});

router.patch("/admin/reviews/:id", requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.review.findFirst({
      where: { OR: [{ reviewId: req.params.id }, { id: req.params.id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = await prisma.review.update({
      where: { id: existing.id },
      data: {
        approvalStatus:
          req.body.approvalStatus === "Approved"
            ? "Approved"
            : req.body.approvalStatus === "Rejected"
            ? "Rejected"
            : "Pending",
        reported: req.body.reported === false ? false : existing.reported,
      },
    });
    return res.json(review);
  } catch (err) {
    return handleDbError(res, err, "Failed to update review status");
  }
});

// ADMIN STATS
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const orders = await prisma.order.findMany();
    const completedOrders = orders.filter((o) => o.status === "Completed");
    const totalRevenue = completedOrders.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;
    const tickets = await getAllTickets();
    const openTickets = tickets.filter(
      (t) => t.status === "Open" || t.status === "In_Progress"
    ).length;

    return res.json({
      totalUsers,
      totalOrders: orders.length,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      openTicketsCount: openTickets,
      conversionRate:
        totalUsers > 0
          ? ((completedOrders.length / totalUsers) * 100).toFixed(1) + "%"
          : "0%",
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch admin stats");
  }
});

// USER & ADMIN MESSAGES
router.get("/user/messages", requireOwnerOrAdmin, async (req, res) => {
  const { userId } = req.query as { userId: string };
  try {
    const logs = await prisma.log.findMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });
    return res.json(logs);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch user messages");
  }
});

router.post("/admin/messages", requireAdmin, async (req, res) => {
  const { userId, subject, message, type } = req.body;
  try {
    const newLog = await prisma.log.create({
      data: {
        action: type || "Message",
        userId: userId || null,
        details: { subject, message, type: type || "Message" },
      },
    });
    return res.json(newLog);
  } catch (err) {
    return handleDbError(res, err, "Failed to send message");
  }
});

// ADMIN DIRECT WALLET CREDIT
router.post("/admin/users/:id/wallet-credit", requireAdmin, async (req, res) => {
  const { amount, reason } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "A valid positive credit amount is required." });
  }

  try {
    const targetUser = await prisma.user.findFirst({
      where: { OR: [{ userId: req.params.id }, { id: req.params.id }, { username: req.params.id }] },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await creditUserWallet({
      userId: targetUser.userId,
      amount: numAmount,
      description: reason || "Administrative wallet credit",
      type: "CREDIT_ADMIN",
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || "Failed to credit wallet" });
    }

    return res.json({
      success: true,
      message: `Successfully credited $${numAmount} to ${targetUser.username}'s wallet. New balance: $${result.newBalance}`,
      newBalance: result.newBalance,
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to apply wallet credit");
  }
});

export default router;
