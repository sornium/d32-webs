import { Router } from "express";
import express from "express";
import { prisma } from "../db.js";
import {
  createZiinaPaymentIntent,
  getZiinaPaymentIntent,
  verifyZiinaWebhookSignature,
} from "../services/ziina.js";
import {
  generateD32OrderId,
  calculateOrderTotals,
  sanitizeOrderForCustomer,
  markOrderPaidAndPreparing,
  generateGuestAccessToken,
} from "../services/orders.js";
import { debitUserWallet } from "../services/wallet.js";
import { handleDbError, getVerifiedCaller } from "../middleware.js";

const router = Router();

// POST /api/payment/intent
router.post("/payment/intent", async (req, res) => {
  const {
    items: rawItemsBody,
    cartItems,
    amount,
    currency = "USD",
    userId: bodyUserId,
    customerEmail,
    guestAccessToken,
    customOrderId,
    discountCode,
    method = "ziina", // "ziina" | "wallet"
    termsAccepted,
    agreeTerms,
    agreePrivacy,
    agreeRefund,
    agreeDigital,
    policyVersion = "2026.1",
  } = req.body;

  const rawItems = rawItemsBody || cartItems || [];
  const caller = await getVerifiedCaller(req);
  const resolvedUserId = caller ? caller.userId : (bodyUserId && bodyUserId !== "guest" ? bodyUserId : "guest");

  if (!amount && (!rawItems || rawItems.length === 0)) {
    return res.status(400).json({ error: "Missing required order items or amount." });
  }

  // Enforce mandatory policy agreements per store requirements
  const isAgreed = Boolean(
    (agreeTerms === true || termsAccepted === true) &&
    (agreePrivacy === true || termsAccepted === true) &&
    (agreeRefund === true || termsAccepted === true) &&
    (agreeDigital === true || termsAccepted === true)
  );

  if (!isAgreed) {
    return res.status(400).json({
      error: "You must accept all required store policies before proceeding to payment.",
    });
  }

  // Record Policy Acceptance
  const userEmail = caller?.email || customerEmail;
  if (userEmail && typeof userEmail === "string" && userEmail.includes("@")) {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      await prisma.policyAcceptance.create({
        data: {
          userId: resolvedUserId !== "guest" ? resolvedUserId : null,
          email: userEmail.trim().toLowerCase(),
          termsOfService: true,
          privacyPolicy: true,
          refundPolicy: true,
          digitalGoodsPolicy: true,
          policyVersion: String(policyVersion),
          ipAddress: ip.substring(0, 100),
          userAgent: userAgent.substring(0, 255),
        },
      });
    } catch (e) {
      console.warn("[Payment Intent] Policy acceptance record note:", e);
    }
  }

  // Clean items and server-side validate prices against catalog database
  const cleanItems = await Promise.all(
    (Array.isArray(rawItems) ? rawItems : []).map(async (i: any) => {
      const pid = i.productId || i.id;
      let unitPrice = Number(i.price || 0) / (Number(i.quantity) || 1);
      if (pid) {
        try {
          const dbProduct = await prisma.product.findFirst({
            where: { OR: [{ productId: String(pid) }, { id: String(pid) }] },
          });
          if (dbProduct && typeof dbProduct.price === "number") {
            unitPrice = dbProduct.price;
          }
        } catch (dbErr) {
          // Fall back to passed price if DB lookup is unavailable
        }
      }
      return {
        id: String(i.id || pid || "item_" + Math.random().toString(36).substring(7)),
        productId: pid,
        name: String(i.name || "Digital Product"),
        price: unitPrice,
        quantity: Math.max(1, Number(i.quantity || 1)),
        category: i.category || "DIGITAL",
        subCategory: i.subCategory || "Accounts",
        brand: i.brand || "D32",
        warranty: Boolean(i.warranty || (i.warrantyPrice && i.warrantyPrice > 0)),
        warrantyPrice: Number(i.warrantyPrice || 0),
        warrantyLabel: String(i.warrantyLabel || ""),
      };
    })
  );

  const totals = calculateOrderTotals(cleanItems, 0);
  const orderPrice = totals.total > 0 ? totals.total : Number(amount);
  const displayOrderId = customOrderId || generateD32OrderId();

  // If Guest checkout: verify or generate a secure guest token
  const secureGuestToken = resolvedUserId === "guest"
    ? (guestAccessToken || generateGuestAccessToken())
    : null;

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const origin = `${protocol}://${host}`;

  try {
    // -------------------------------------------------------------
    // OPTION A: PAYMENT VIA D32 WALLET (STORE CREDIT)
    // -------------------------------------------------------------
    if (method === "wallet") {
      if (!caller || resolvedUserId === "guest") {
        return res.status(401).json({
          error: "You must be logged into your D32 account to pay with wallet store credit.",
        });
      }

      // Atomically debit user wallet in backend
      const debitResult = await debitUserWallet({
        userId: resolvedUserId,
        amount: orderPrice,
        description: `Payment for Order #${displayOrderId}`,
        orderId: displayOrderId,
      });

      if (!debitResult.success) {
        return res.status(400).json({
          error: debitResult.error || "Insufficient wallet balance to complete this purchase.",
        });
      }

      // Create order directly as "Preparing" (Payment confirmed via wallet)
      const order = await prisma.order.create({
        data: {
          orderId: displayOrderId,
          userId: resolvedUserId,
          cartItems: cleanItems,
          price: orderPrice,
          currency: String(currency).toUpperCase(),
          ziinaIntentId: `wallet_${displayOrderId}`,
          paymentStatus: "paid_with_wallet",
          paymentVerifiedAt: new Date(),
          status: "Preparing", // Stays preparing until admin assigns keys!
          termsAcceptedAt: termsAccepted ? new Date() : null,
          policyVersion: String(policyVersion),
        },
      });

      const redirectUrl = `${origin}/order/success?order_id=${displayOrderId}`;

      return res.json({
        success: true,
        method: "wallet",
        redirect_url: redirectUrl,
        order_id: displayOrderId,
        orderId: order.id,
        status: "Preparing",
        walletBalance: debitResult.newBalance,
      });
    }

    // -------------------------------------------------------------
    // OPTION B: PAYMENT VIA ZIINA GATEWAY
    // -------------------------------------------------------------
    const guestParam = secureGuestToken ? `&guest_token=${encodeURIComponent(secureGuestToken)}` : "";
    const successUrl = `${origin}/order/success?order_id=${displayOrderId}${guestParam}`;
    const cancelUrl = `${origin}/cart?canceled=true`;

    const ziinaResult = await createZiinaPaymentIntent({
      amount: orderPrice,
      currency: String(currency).toUpperCase(),
      message: `d32.store Order #${displayOrderId}`,
      successUrl,
      cancelUrl,
      metadata: {
        orderId: displayOrderId,
        userId: resolvedUserId,
        customerEmail: customerEmail || "",
      },
    });

    if (!ziinaResult.success || !ziinaResult.redirectUrl) {
      return res.status(400).json({
        error: ziinaResult.error || "Failed to initialize Ziina payment gateway.",
      });
    }

    const intentId = ziinaResult.data?.id || `sim_${displayOrderId}`;

    // Save pending order in database
    const order = await prisma.order.create({
      data: {
        orderId: displayOrderId,
        userId: resolvedUserId,
        cartItems: cleanItems,
        price: orderPrice,
        currency: String(currency).toUpperCase(),
        ziinaIntentId: intentId,
        paymentStatus: "pending",
        status: "Pending",
        guestEmail: customerEmail || null,
        guestAccessToken: secureGuestToken,
        termsAcceptedAt: termsAccepted ? new Date() : null,
        policyVersion: String(policyVersion),
      },
    });

    return res.json({
      success: true,
      redirect_url: ziinaResult.redirectUrl,
      intent_id: intentId,
      order_id: displayOrderId,
      orderId: order.id,
      guest_token: secureGuestToken,
      simulated: ziinaResult.simulated || intentId.startsWith("sim_"),
    });
  } catch (err: any) {
    console.error("[Payment Intent API Exception]:", err);
    return res.status(500).json({
      error: "Internal server error initiating payment. " + (err?.message || ""),
    });
  }
});

// POST /api/payment/verify (Server-side payment verification)
router.post("/payment/verify", async (req, res) => {
  const { intentId, confirmSimulated, orderId, guestToken } = req.body;
  const lookupId = orderId || intentId;
  const caller = await getVerifiedCaller(req);

  if (!lookupId) {
    return res.status(400).json({ error: "Intent ID or Order ID is required" });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderId: lookupId },
          { ziinaIntentId: lookupId },
          { id: lookupId },
        ],
      },
      include: {
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Security check: only owner, admin, or guest with token can verify/view
    const isOwner = caller && (order.userId === caller.userId || order.userId === caller.username);
    const isAdmin = caller?.role === "admin";
    const passedGuestToken = guestToken || (req.headers["x-guest-token"] as string) || (req.query.guest_token as string);
    const isGuestAuthorized = Boolean(
      order.userId === "guest" &&
      passedGuestToken &&
      order.guestAccessToken &&
      passedGuestToken.trim() === order.guestAccessToken.trim()
    );

    // CRITICAL SECURITY: Block unauthorized callers from inspecting or manipulating order payment status
    if (!isOwner && !isAdmin && !isGuestAuthorized) {
      return res.status(403).json({
        error: "Access denied. You do not have authorization to view or verify this order.",
      });
    }

    // If caller is now authenticated and order was a guest order with their verified email, associate it
    if (caller && order.userId === "guest" && caller.email && order.guestEmail === caller.email) {
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: caller.userId },
      });
      order.userId = caller.userId;
    }

    // Idempotency: If already paid and in Preparing or Completed
    if (order.status === "Preparing" || order.status === "Completed") {
      const sanitized = sanitizeOrderForCustomer(order, Boolean(isAdmin));
      return res.json({
        success: true,
        status: order.status,
        order: sanitized,
      });
    }

    // Simulated test intent confirmation
    const isSimulated =
      order.ziinaIntentId?.startsWith("sim_") ||
      (typeof lookupId === "string" && lookupId.startsWith("sim_"));

    if (isSimulated) {
      if (confirmSimulated) {
        // Payment verified! Order transitions to Preparing (NOT Completed immediately!)
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "Preparing",
            paymentStatus: "completed",
            paymentVerifiedAt: new Date(),
          },
        });

        const sanitized = sanitizeOrderForCustomer(updatedOrder, Boolean(isAdmin));
        return res.json({
          success: true,
          status: "Preparing",
          order: sanitized,
          message: "Payment successfully authorized. Order is now Preparing.",
        });
      } else {
        return res.json({
          success: false,
          simulated: true,
          status: "Pending",
          order: sanitizeOrderForCustomer(order, Boolean(isAdmin)),
          message: "Simulation mode: Please click 'Authorize Test Payment' to verify payment.",
        });
      }
    }

    // Live Ziina API verification
    const ziinaStatusRes = await getZiinaPaymentIntent(order.ziinaIntentId || lookupId);

    if (ziinaStatusRes.status === "completed") {
      // Payment verified via live Ziina API! Transitions to Preparing
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "Preparing",
          paymentStatus: "completed",
          paymentVerifiedAt: new Date(),
        },
      });

      const sanitized = sanitizeOrderForCustomer(updatedOrder, Boolean(isAdmin));
      return res.json({
        success: true,
        status: "Preparing",
        order: sanitized,
        message: "Payment verified successfully on Ziina. Order is now Preparing.",
      });
    } else if (ziinaStatusRes.status === "failed") {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "Cancelled",
          paymentStatus: "failed",
          paymentError: ziinaStatusRes.error || "Payment declined or failed on gateway.",
        },
      });

      return res.json({
        success: false,
        status: "failed",
        order: sanitizeOrderForCustomer(updatedOrder, Boolean(isAdmin)),
        error: "Payment was declined on Ziina gateway. Please try another card.",
      });
    } else if (ziinaStatusRes.status === "cancelled") {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "Cancelled",
          paymentStatus: "cancelled",
        },
      });

      return res.json({
        success: false,
        status: "cancelled",
        order: sanitizeOrderForCustomer(updatedOrder, Boolean(isAdmin)),
        error: "Payment was cancelled.",
      });
    } else {
      return res.json({
        success: false,
        status: "pending",
        order: sanitizeOrderForCustomer(order, Boolean(isAdmin)),
        message: "Payment is pending authorization on Ziina. Please complete payment.",
      });
    }
  } catch (err) {
    return handleDbError(res, err, "Payment verification failed");
  }
});

// ZIINA WEBHOOK WITH HMAC SIGNATURE VALIDATION
export const handleZiinaWebhook = async (req: express.Request, res: express.Response) => {
  try {
    const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const signatureHeader = (req.get("x-hmac-signature") || req.get("X-Hmac-Signature")) as string;

    const isValid = verifyZiinaWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.warn("[Ziina Webhook] Invalid HMAC signature received. Rejected.");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const payload = req.body || {};
    const intentId =
      payload.data?.id ||
      payload.id ||
      payload.payment_intent_id ||
      payload.data?.payment_intent_id;

    const rawStatus = String(payload.data?.status || payload.status || payload.event || "").toLowerCase();

    if (!intentId) {
      return res.status(400).json({ error: "Missing intent ID in webhook payload" });
    }

    if (
      rawStatus.includes("completed") ||
      rawStatus.includes("succeeded") ||
      rawStatus === "paid"
    ) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ ziinaIntentId: intentId }, { orderId: intentId }],
        },
      });

      // When paid, moves to "Preparing" (admin then assigns key to mark Completed)
      if (order && order.status === "Pending") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "Preparing",
            paymentStatus: "completed",
            paymentVerifiedAt: new Date(),
          },
        });
        console.log(`[Ziina Webhook] Order ${order.orderId} verified and moved to Preparing.`);
      }
    } else if (rawStatus.includes("failed") || rawStatus.includes("rejected")) {
      await prisma.order.updateMany({
        where: {
          OR: [{ ziinaIntentId: intentId }, { orderId: intentId }],
        },
        data: {
          status: "Cancelled",
          paymentStatus: "failed",
          paymentError: "Payment failed on Ziina gateway webhook.",
        },
      });
    }

    return res.json({ received: true, verified: true });
  } catch (err) {
    console.error("[Ziina Webhook Error]:", err);
    return res.status(500).json({ error: "Internal webhook processing error" });
  }
};

router.post("/payment/webhook", handleZiinaWebhook);
router.post("/webhooks/ziina", handleZiinaWebhook);

export default router;
