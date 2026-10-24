import { Router } from "express";
import { prisma } from "../db.js";
import {
  sanitizeOrderForCustomer,
  adminAssignItemAndComplete,
  adminRefundOrderToWallet,
} from "../services/orders.js";
import { handleDbError, requireAdmin, requireOwnerOrAdmin, getVerifiedCaller } from "../middleware.js";

const router = Router();

// GET /api/user/orders (Customer accesses ONLY their own orders)
router.get("/user/orders", requireOwnerOrAdmin, async (req, res) => {
  const caller = (req as any).user;
  const queryUserId = req.query.userId as string;
  const targetId = caller.role === "admin" && queryUserId ? queryUserId : caller.userId;

  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: targetId },
          { user: { id: targetId } },
          { user: { userId: targetId } },
          { user: { username: targetId } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const isRequesterAdmin = caller.role === "admin";
    const sanitized = orders.map((ord) => sanitizeOrderForCustomer(ord, isRequesterAdmin));

    return res.json(sanitized);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch user orders");
  }
});

// GET /api/orders/:id (Secure single order lookup)
router.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const caller = await getVerifiedCaller(req);
  const guestToken =
    (req.headers["x-guest-token"] as string) ||
    (req.query.guest_token as string) ||
    (req.query.token as string) ||
    "";

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderId: id }, { id: id }, { ziinaIntentId: id }],
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = caller && (order.userId === caller.userId || order.userId === caller.username);
    const isAdmin = caller?.role === "admin";
    const isGuestAuthorized = Boolean(
      order.userId === "guest" &&
      guestToken &&
      order.guestAccessToken &&
      guestToken.trim() === order.guestAccessToken.trim()
    );

    // CRITICAL SECURITY: Knowing an order number or email alone must NEVER be enough!
    if (!isOwner && !isAdmin && !isGuestAuthorized) {
      return res.status(403).json({
        error: "Access denied. You do not have authorization to view this order.",
      });
    }

    const sanitized = sanitizeOrderForCustomer(order, isAdmin);
    return res.json(sanitized);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch order details");
  }
});

// GET /api/admin/orders (Admin list all orders with payment verification & error info)
router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const enriched = orders.map((ord) => ({
      ...sanitizeOrderForCustomer(ord, true),
      customerEmail: ord.user?.email || ord.guestEmail || "N/A",
      customerUsername: ord.user?.username || "Guest",
      isPaid: ord.paymentStatus === "completed" || ord.paymentStatus === "paid_with_wallet" || ord.status === "Completed" || ord.status === "Preparing",
      paymentError: ord.paymentError || null,
      assignedItemKey: ord.assignedItemKey || null,
      assignedItemNotes: ord.assignedItemNotes || null,
      assignedAt: ord.assignedAt,
      assignedBy: ord.assignedBy,
    }));

    return res.json(enriched);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch admin orders");
  }
});

// POST /api/admin/orders/:id/assign (Admin assigns purchased key/credentials and marks Completed)
router.post("/admin/orders/:id/assign", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { itemKey, itemNotes } = req.body;
  const caller = (req as any).user;

  if (!itemKey?.trim()) {
    return res.status(400).json({ error: "Product key / item credentials are required." });
  }

  try {
    const host = req.get("host") || "d32.store";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const originUrl = `${protocol}://${host}`;

    const updated = await adminAssignItemAndComplete({
      orderIdentifier: id,
      assignedItemKey: itemKey,
      assignedItemNotes: itemNotes,
      adminUserId: caller.userId || caller.username || "admin",
      originUrl,
    });

    return res.json({
      success: true,
      message: "Item key assigned and order marked Completed successfully.",
      order: sanitizeOrderForCustomer(updated, true),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to assign item to order." });
  }
});

// POST /api/admin/orders/:id/refund (Admin refunds order to customer's D32 Store wallet)
router.post("/admin/orders/:id/refund", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const caller = (req as any).user;

  try {
    const result = await adminRefundOrderToWallet({
      orderIdentifier: id,
      refundAmount: amount ? Number(amount) : undefined,
      reason: reason || "Admin order refund",
      adminUserId: caller.userId || caller.username || "admin",
    });

    return res.json({
      success: true,
      message: `Refund of $${result.refundAmount} issued to customer wallet. New balance: $${result.newWalletBalance}.`,
      order: sanitizeOrderForCustomer(result.order, true),
      newBalance: result.newWalletBalance,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Failed to process wallet refund." });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch("/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const { status, paymentError } = req.body;

  const validStatuses = ["Pending", "Paid", "Preparing", "Completed", "Cancelled", "Refunded"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status value" });
  }

  try {
    const existing = await prisma.order.findFirst({
      where: { OR: [{ orderId: req.params.id }, { id: req.params.id }] },
    });
    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        status: status as any,
        paymentError: paymentError !== undefined ? paymentError : existing.paymentError,
      },
    });

    return res.json(sanitizeOrderForCustomer(updated, true));
  } catch (err) {
    return handleDbError(res, err, "Failed to update order status");
  }
});

export default router;
