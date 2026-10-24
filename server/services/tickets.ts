import { prisma, isDatabaseConfigured } from "../db.js";
import { sendTicketReplyNotification } from "./email.js";

export function generateTicketId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TCK-${num}`;
}

export async function createTicket(params: {
  userId: string;
  username: string;
  userEmail?: string;
  orderId?: string;
  subject: string;
  category?: string;
  priority?: "Low" | "Medium" | "High";
  initialMessage: string;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database required to create support ticket");
  }

  // Ensure user exists or use guest
  let validUserId = params.userId;
  if (!validUserId || validUserId === "guest") {
    // Check if guest user exists in DB
    const guestUser = await prisma.user.findFirst({
      where: { OR: [{ userId: "guest" }, { username: "guest" }] },
    });
    if (!guestUser) {
      const createdGuest = await prisma.user.create({
        data: {
          userId: "guest",
          username: "guest",
          email: "guest@d32.store",
          role: "customer",
          authProvider: "Email",
          status: "Active",
        },
      });
      validUserId = createdGuest.userId;
    } else {
      validUserId = guestUser.userId;
    }
  }

  const ticketId = generateTicketId();

  const ticket = await prisma.ticket.create({
    data: {
      ticketId,
      userId: validUserId,
      orderId: params.orderId || null,
      customerEmail: params.userEmail || null,
      customerName: params.username || "Customer",
      subject: params.subject.trim(),
      category: params.category || "General",
      priority: params.priority || "Medium",
      status: "Open",
      messages: {
        create: [
          {
            senderId: validUserId,
            senderRole: "customer",
            senderName: params.username || "Customer",
            message: params.initialMessage.trim(),
          },
        ],
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      order: {
        select: {
          orderId: true,
          status: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  return ticket;
}

export async function getUserTickets(userId: string) {
  if (!isDatabaseConfigured() || !userId) return [];

  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { userId: userId },
        { user: { id: userId } },
        { user: { userId: userId } },
        { user: { username: userId } },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      order: {
        select: {
          orderId: true,
          status: true,
          price: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets;
}

export async function getAllTickets() {
  if (!isDatabaseConfigured()) return [];

  const tickets = await prisma.ticket.findMany({
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: {
          username: true,
          email: true,
          role: true,
        },
      },
      order: {
        select: {
          orderId: true,
          status: true,
          price: true,
          paymentStatus: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets;
}

export async function getTicketById(identifier: string) {
  if (!isDatabaseConfigured() || !identifier) return null;

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [{ ticketId: identifier }, { id: identifier }],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: {
          username: true,
          email: true,
          role: true,
        },
      },
      order: {
        select: {
          orderId: true,
          status: true,
          price: true,
          paymentStatus: true,
        },
      },
    },
  });

  return ticket;
}

export async function addTicketMessage(params: {
  ticketIdentifier: string;
  senderId: string;
  senderName: string;
  senderRole: "admin" | "customer";
  messageText: string;
  originUrl?: string;
}) {
  if (!isDatabaseConfigured()) return null;

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [{ ticketId: params.ticketIdentifier }, { id: params.ticketIdentifier }],
    },
    include: {
      user: true,
    },
  });

  if (!ticket) return null;

  const newStatus =
    params.senderRole === "admin"
      ? ticket.status === "Closed"
        ? "Closed"
        : "Answered"
      : "Open";

  // Create message and update ticket status
  const [createdMsg, updatedTicket] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket.ticketId,
        senderId: params.senderId,
        senderRole: params.senderRole,
        senderName: params.senderName,
        message: params.messageText.trim(),
      },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        order: true,
      },
    }),
  ]);

  // If admin replied, send email notification to customer via Resend!
  if (params.senderRole === "admin") {
    const customerEmail = ticket.customerEmail || ticket.user?.email;
    if (customerEmail) {
      const origin = params.originUrl || "https://d32.store";
      const portalUrl = `${origin}/dashboard/tickets?id=${ticket.ticketId}`;

      sendTicketReplyNotification({
        customerEmail,
        customerName: ticket.customerName || ticket.user?.username || "Customer",
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        agentName: params.senderName || "Support Specialist",
        portalUrl,
      }).catch((e) => console.warn("[Tickets Service] Resend email warning:", e));
    }
  }

  return updatedTicket;
}

export async function updateTicketStatus(
  identifier: string,
  status: "Open" | "In_Progress" | "Answered" | "Closed"
) {
  if (!isDatabaseConfigured()) return null;

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [{ ticketId: identifier }, { id: identifier }],
    },
  });

  if (!ticket) return null;

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return updated;
}
