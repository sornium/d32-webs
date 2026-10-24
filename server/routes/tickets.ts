import { Router } from "express";
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} from "../services/tickets.js";
import { requireAdmin, requireOwnerOrAdmin, getVerifiedCaller, handleDbError } from "../middleware.js";

const router = Router();

// POST /api/tickets (Create ticket for issue, missing item, payment error, etc.)
router.post("/tickets", async (req, res) => {
  const { subject, category, priority, message, orderId, userEmail, username } = req.body;
  const caller = await getVerifiedCaller(req);

  if (!subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Subject and message are required" });
  }

  const validUserId = caller ? caller.userId : "guest";
  const validUsername = caller ? caller.username : (username || "Guest Customer");
  const validEmail = caller?.email || userEmail || "";

  try {
    const ticket = await createTicket({
      userId: validUserId,
      username: validUsername,
      userEmail: validEmail,
      orderId: orderId || undefined,
      subject: subject.trim(),
      category: category || "Order Issue",
      priority: priority || "Medium",
      initialMessage: message.trim(),
    });

    return res.status(201).json(ticket);
  } catch (err: any) {
    console.error("[Tickets API error]:", err);
    return res.status(500).json({ error: err?.message || "Failed to create support ticket" });
  }
});

// GET /api/user/tickets
router.get("/user/tickets", requireOwnerOrAdmin, async (req, res) => {
  const caller = (req as any).user;
  try {
    const tickets = await getUserTickets(caller.userId);
    return res.json(tickets);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch user tickets");
  }
});

// GET /api/tickets/:id
router.get("/tickets/:id", async (req, res) => {
  const { id } = req.params;
  const caller = await getVerifiedCaller(req);

  try {
    const ticket = await getTicketById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Authorization check: verified owner, administrator, or matching customer email
    const isOwner = Boolean(
      caller && (
        ticket.userId === caller.userId || 
        ticket.userId === caller.username ||
        (caller.email && ticket.customerEmail && caller.email.toLowerCase() === ticket.customerEmail.toLowerCase())
      )
    );
    const isAdmin = caller?.role === "admin";
    const reqEmail = ((req.query.email as string) || (req.headers["x-ticket-email"] as string) || "").trim().toLowerCase();
    const isGuestAuthorized = Boolean(
      ticket.userId === "guest" &&
      reqEmail &&
      ticket.customerEmail &&
      reqEmail === ticket.customerEmail.toLowerCase()
    );

    if (!isOwner && !isAdmin && !isGuestAuthorized) {
      return res.status(403).json({ error: "Access denied. You do not have authorization to view this ticket." });
    }

    return res.json(ticket);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch ticket");
  }
});

// POST /api/tickets/:id/messages (Send reply on ticket, triggers Resend email if admin replies)
router.post("/tickets/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { message, text } = req.body;
  const content = (message || text || "").trim();

  if (!content) {
    return res.status(400).json({ error: "Message text is required" });
  }

  const caller = await getVerifiedCaller(req);
  if (!caller) {
    return res.status(401).json({ error: "Authentication required to reply to ticket" });
  }

  const isRequesterAdmin = caller.role === "admin";
  const verifiedRole: "admin" | "customer" = isRequesterAdmin ? "admin" : "customer";
  const senderName = isRequesterAdmin ? (caller.username || "Support Agent") : (caller.username || "Customer");

  const host = req.get("host") || "d32.store";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const originUrl = `${protocol}://${host}`;

  try {
    const updated = await addTicketMessage({
      ticketIdentifier: id,
      senderId: caller.userId,
      senderName,
      senderRole: verifiedRole,
      messageText: content,
      originUrl,
    });

    if (!updated) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.json(updated);
  } catch (err) {
    return handleDbError(res, err, "Failed to post message on ticket");
  }
});

// GET /api/admin/tickets
router.get("/admin/tickets", requireAdmin, async (req, res) => {
  try {
    const tickets = await getAllTickets();
    return res.json(tickets);
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch tickets for admin");
  }
});

// PATCH /api/admin/tickets/:id/status
router.patch("/admin/tickets/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["Open", "In_Progress", "Answered", "Closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid ticket status value" });
  }

  try {
    const ticket = await updateTicketStatus(req.params.id, status as any);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    return res.json(ticket);
  } catch (err) {
    return handleDbError(res, err, "Failed to update ticket status");
  }
});

export default router;
