import React, { useState, useEffect } from "react";
import { LifeBuoy, Plus, Send, Clock, CheckCircle2, AlertCircle, MessageSquare, RefreshCw, X } from "lucide-react";
import { useStore } from "../../store";
import toast from "react-hot-toast";

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface TicketItem {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  status: "Open" | "In_Progress" | "Answered" | "Closed";
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

interface AccountTicketsProps {
  initialOrderId?: string;
}

export default function AccountTickets({ initialOrderId }: AccountTicketsProps) {
  const { user } = useStore();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [isCreateOpen, setIsCreateOpen] = useState(Boolean(initialOrderId));
  const [subject, setSubject] = useState(initialOrderId ? `Issue with Order #${initialOrderId}` : "");
  const [category, setCategory] = useState("Order Issue");
  const [priority, setPriority] = useState("Medium");
  const [orderId, setOrderId] = useState(initialOrderId || "");
  const [initialMessage, setInitialMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Message reply
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchTickets = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch(`/api/user/tickets?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        if (selectedTicket) {
          const found = list.find((t) => t.ticketId === selectedTicket.ticketId);
          if (found) setSelectedTicket(found);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      toast.error("Subject and message are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          orderId: orderId.trim() || undefined,
          message: initialMessage.trim(),
          username: user?.username || user?.name || "Customer",
          userEmail: user?.email || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create support ticket.");
      }

      toast.success("Support ticket opened successfully!");
      setIsCreateOpen(false);
      setSubject("");
      setInitialMessage("");
      setOrderId("");
      fetchTickets();
      setSelectedTicket(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch(`/api/tickets/${selectedTicket.ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to post message.");

      setReplyText("");
      setSelectedTicket(data);
      fetchTickets();
      toast.success("Message sent to staff!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-white/80" />
            <span>Support & Order Reports</span>
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Report incorrect orders, missing keys, payment questions, or request assistance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={loading}
            className="h-9 px-3 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-white/60 px-1">
            Your Support Tickets ({tickets.length})
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-white/50">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-white/40" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/[0.06] border border-white/10 text-center space-y-2">
              <MessageSquare className="w-7 h-7 text-white/40 mx-auto" />
              <h4 className="text-xs font-semibold text-white">No Support Tickets</h4>
              <p className="text-[11px] text-white/50">
                You have not opened any support requests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.ticketId === t.ticketId;
                const isAnswered = t.status === "Answered";
                const isClosed = t.status === "Closed";

                return (
                  <div
                    key={t.ticketId}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? "bg-white/20 border-white shadow-lg"
                        : "bg-white/[0.06] border-white/10 hover:bg-white/[0.10]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white/70 font-semibold">#{t.ticketId}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAnswered
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : isClosed
                            ? "bg-white/10 text-white/50"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{t.subject}</h4>

                    <div className="flex items-center justify-between text-[11px] text-white/50 pt-0.5">
                      <span>{t.category}</span>
                      <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Ticket Conversation */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-xl space-y-4 flex flex-col h-[520px]">
              {/* Ticket Top bar */}
              <div className="border-b border-white/10 pb-3 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-white/80 font-bold bg-white/10 px-2 py-0.5 rounded">
                      #{selectedTicket.ticketId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {selectedTicket.category}
                    </span>
                    {selectedTicket.orderId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Order #{selectedTicket.orderId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{selectedTicket.subject}</h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 text-white shrink-0">
                  {selectedTicket.status}
                </span>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {selectedTicket.messages.map((msg, idx) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                        isAdmin
                          ? "bg-purple-500/15 border border-purple-500/30 ml-4 sm:ml-8"
                          : "bg-white/[0.06] border border-white/10 mr-4 sm:mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-white/50">
                        <span className={`font-semibold ${isAdmin ? "text-purple-300" : "text-white"}`}>
                          {msg.senderName} {isAdmin && "· Staff Agent"}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== "Closed" ? (
                <form onSubmit={handleSendReply} className="pt-2 border-t border-white/10 flex gap-2 shrink-0">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to staff..."
                    className="flex-1 h-11 px-4 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="h-11 px-5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 rounded-2xl bg-white/[0.04] text-center text-xs text-white/50">
                  This ticket has been marked as closed.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white/[0.06] border border-white/10 text-center space-y-3 h-[420px] flex flex-col items-center justify-center">
              <LifeBuoy className="w-10 h-10 text-white/40" />
              <h3 className="text-sm font-bold text-white">Select a Ticket</h3>
              <p className="text-xs text-white/50 max-w-sm">
                Choose a ticket from the left panel to inspect staff responses and continue the conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Ticket */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0b0c10] border border-white/20 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Open Support Request</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                >
                  <option value="Order Issue" className="bg-[#111]">Order Issue / Delay</option>
                  <option value="Missing Item" className="bg-[#111]">Missing Item / Key</option>
                  <option value="Payment Error" className="bg-[#111]">Payment Question / Error</option>
                  <option value="Refund Request" className="bg-[#111]">Refund to Wallet Request</option>
                  <option value="General Support" className="bg-[#111]">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Related Order ID (Optional)</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. D32-123456"
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none resize-none custom-scrollbar"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
