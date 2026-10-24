import crypto from "crypto";
import { prisma, isDatabaseConfigured } from "../db.js";
import { getStoreSettings } from "./storeSettings.js";
import { sendOrderCompletedNotification } from "./email.js";
import { creditUserWallet } from "./wallet.js";

export interface OrderCartItem {
  id?: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  warranty?: boolean;
  warrantyLabel?: string;
  warrantyPrice?: number;
  warrantyInfo?: string;
}

export function generateD32OrderId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `D32-${randomNum}`;
}

export function generateGuestAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function calculateOrderTotals(
  items: OrderCartItem[],
  discountAmount: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  handlingFee: number;
  total: number;
} {
  const settings = getStoreSettings();

  const subtotal = items.reduce((sum, it) => {
    const itemTotal = it.price * (it.quantity || 1) + (it.warrantyPrice || 0);
    return sum + itemTotal;
  }, 0);

  const cleanDiscount = Math.min(discountAmount, subtotal);
  const discountedSubtotal = Math.max(0, subtotal - cleanDiscount);

  const vatRate = settings.vatEnabled ? settings.vatRate : 0;
  const vatAmount = Math.round(discountedSubtotal * vatRate * 100) / 100;
  const handlingFee = Math.round(discountedSubtotal * (settings.handlingFeePercent || 0.025) * 100) / 100;
  const total = Math.round((discountedSubtotal + vatAmount + handlingFee) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(cleanDiscount * 100) / 100,
    taxableAmount: Math.round(discountedSubtotal * 100) / 100,
    vatRate,
    vatAmount,
    handlingFee,
    total,
  };
}

/**
 * Filter sensitive keys/fulfillment: customer ONLY receives assignedItemKey if order status is Completed!
 */
export function sanitizeOrderForCustomer(order: any, isRequesterAdmin: boolean) {
  const isCompleted = order.status === "Completed";
  const displayId = order.orderId?.startsWith("D32-")
    ? order.orderId
    : `D32-${(order.orderId || order.id).substring(0, 6).toUpperCase()}`;

  // If admin, return all data including admin notes and assigned info
  if (isRequesterAdmin) {
    return {
      ...order,
      displayId,
      canAccessKey: true,
    };
  }

  // If customer, ONLY return assignedItemKey and assignedItemNotes if order status is Completed
  return {
    id: order.id,
    orderId: order.orderId,
    displayId,
    userId: order.userId,
    cartItems: order.cartItems,
    price: order.price,
    currency: order.currency,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentStatus === "paid_with_wallet" ? "Store Wallet Credit" : (order.ziinaIntentId ? "Ziina Payment Gateway" : "Online Payment"),
    transactionId: order.ziinaIntentId || order.orderId,
    customerEmail: order.user?.email || order.guestEmail || null,
    customerName: order.user?.username || "Customer",
    paymentVerifiedAt: order.paymentVerifiedAt,
    termsAcceptedAt: order.termsAcceptedAt,
    policyVersion: order.policyVersion,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    assignedAt: isCompleted ? order.assignedAt : null,
    // Sensitive keys/item details strictly gated:
    assignedItemKey: isCompleted ? order.assignedItemKey : null,
    assignedItemNotes: isCompleted ? order.assignedItemNotes : null,
    canAccessKey: isCompleted && Boolean(order.assignedItemKey),
  };
}

/**
 * Creates order in PostgreSQL
 */
export async function createNewOrder(params: {
  userId?: string;
  customerEmail?: string;
  items: OrderCartItem[];
  currency: string;
  ziinaIntentId?: string;
  guestAccessToken?: string;
  paymentStatus?: string;
  termsAccepted?: boolean;
  policyVersion?: string;
}) {
  const displayOrderId = generateD32OrderId();
  const totals = calculateOrderTotals(params.items, 0);

  const cartPayload = params.items.map((it) => ({
    ...it,
    subtotal: it.price * (it.quantity || 1) + (it.warrantyPrice || 0),
  }));

  if (!isDatabaseConfigured()) {
    throw new Error("PostgreSQL database is required for order creation");
  }

  let validDbUserId = "guest";
  if (params.userId && params.userId !== "guest") {
    const matchedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: params.userId },
          { id: params.userId },
          { username: params.userId },
          { email: params.userId },
        ],
      },
    });
    if (matchedUser) {
      validDbUserId = matchedUser.userId;
    }
  }

  const orderData = {
    orderId: displayOrderId,
    userId: validDbUserId,
    cartItems: cartPayload as any,
    price: totals.total,
    currency: params.currency || "USD",
    ziinaIntentId: params.ziinaIntentId || displayOrderId,
    status: "Pending" as const,
    paymentStatus: params.paymentStatus || "pending",
    guestEmail: params.customerEmail || null,
    guestAccessToken: params.guestAccessToken || (validDbUserId === "guest" ? generateGuestAccessToken() : null),
    termsAcceptedAt: params.termsAccepted ? new Date() : null,
    policyVersion: params.policyVersion || "2026.1",
  };

  const created = await prisma.order.create({
    data: orderData,
  });

  return {
    ...created,
    displayId: displayOrderId,
    totals,
  };
}

/**
 * Mark order as Paid / Preparing upon confirmed payment from Ziina or Wallet
 */
export async function markOrderPaidAndPreparing(params: {
  orderIdentifier: string;
  paymentStatus?: string;
  paymentError?: string;
}) {
  if (!isDatabaseConfigured()) return null;

  const existing = await prisma.order.findFirst({
    where: {
      OR: [
        { orderId: params.orderIdentifier },
        { id: params.orderIdentifier },
        { ziinaIntentId: params.orderIdentifier },
      ],
    },
  });

  if (!existing) return null;

  // Once paid, order transitions to "Preparing"
  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: {
      status: "Preparing",
      paymentStatus: params.paymentStatus || "completed",
      paymentVerifiedAt: new Date(),
      paymentError: params.paymentError || null,
    },
  });

  return updated;
}

/**
 * Admin assigns product key / credentials to order and marks it Completed
 */
export async function adminAssignItemAndComplete(params: {
  orderIdentifier: string;
  assignedItemKey: string;
  assignedItemNotes?: string;
  adminUserId: string;
  originUrl?: string;
}) {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");

  const existing = await prisma.order.findFirst({
    where: {
      OR: [{ orderId: params.orderIdentifier }, { id: params.orderIdentifier }],
    },
    include: {
      user: true,
    },
  });

  if (!existing) {
    throw new Error("Order not found");
  }

  if (!params.assignedItemKey?.trim()) {
    throw new Error("Product key or credentials are required to complete this order");
  }

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: {
      status: "Completed",
      assignedItemKey: params.assignedItemKey.trim(),
      assignedItemNotes: params.assignedItemNotes?.trim() || null,
      assignedAt: new Date(),
      assignedBy: params.adminUserId,
    },
  });

  // Notify customer via Resend if email is available
  const recipientEmail = existing.user?.email || existing.guestEmail;
  if (recipientEmail) {
    const origin = params.originUrl || "https://d32.store";
    const portalUrl = existing.userId !== "guest"
      ? `${origin}/dashboard/orders`
      : `${origin}/order/success?order_id=${existing.orderId}&guest_token=${existing.guestAccessToken}`;

    sendOrderCompletedNotification({
      customerEmail: recipientEmail,
      orderId: existing.orderId,
      portalUrl,
    }).catch((e) => console.warn("[Orders Service] Resend notification warning:", e));
  }

  return updated;
}

/**
 * Admin refund order to customer's D32 Store wallet
 */
export async function adminRefundOrderToWallet(params: {
  orderIdentifier: string;
  refundAmount?: number;
  reason?: string;
  adminUserId: string;
}) {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderId: params.orderIdentifier }, { id: params.orderIdentifier }],
    },
  });

  if (!order) throw new Error("Order not found");

  if (!order.userId || order.userId === "guest") {
    throw new Error("Customer does not have an active D32 account for wallet store credit.");
  }

  const amountToRefund = params.refundAmount && params.refundAmount > 0 ? params.refundAmount : order.price;

  const walletRes = await creditUserWallet({
    userId: order.userId,
    amount: amountToRefund,
    description: `Refund for Order #${order.orderId}: ${params.reason || "Store credit refund"}`,
    orderId: order.orderId,
    type: "CREDIT_REFUND",
  });

  if (!walletRes.success) {
    throw new Error(walletRes.error || "Failed to credit customer wallet");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "Refunded",
    },
  });

  return {
    order: updatedOrder,
    refundAmount: amountToRefund,
    newWalletBalance: walletRes.newBalance,
  };
}
