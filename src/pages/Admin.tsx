import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";
import {
  Users,
  ShoppingBag,
  ListOrdered,
  ShieldAlert,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  Tag,
  LifeBuoy,
  Send,
  Clock,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import toast from "react-hot-toast";
import DbDiagnostics from "../components/DbDiagnostics";
import DashboardMonitoring from "../components/DashboardMonitoring";
import SystemStatusWidget from "../components/SystemStatusWidget";
import AdminCatalogManager from "../components/AdminCatalogManager";
import { useCurrency } from "../lib/currency";
import { useTranslation } from "../lib/i18n";

export default function Admin() {
  const { user } = useStore();
  const { currency, formatPrice } = useCurrency();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [proxies, setProxies] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"catalog" | "operations" | "tickets" | "diagnostics">("catalog");

  // Order Details & Fulfillment States
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [assignKeyInput, setAssignKeyInput] = useState("");
  const [assignNotesInput, setAssignNotesInput] = useState("");
  const [isAssigningKey, setIsAssigningKey] = useState(false);
  const [refundAmountInput, setRefundAmountInput] = useState("");
  const [isRefundingOrder, setIsRefundingOrder] = useState(false);

  // User Wallet Credit Modal State
  const [selectedUserForWallet, setSelectedUserForWallet] = useState<any | null>(null);
  const [walletCreditAmount, setWalletCreditAmount] = useState("");
  const [walletCreditReason, setWalletCreditReason] = useState("");
  const [isCreditingWallet, setIsCreditingWallet] = useState(false);

  const getAdminHeaders = (isJson = false) => {
    const currentToken = useStore.getState().token;
    return {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      "X-User-Id": user?.id || "",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  useEffect(() => {
    fetchProxies();
    fetchReviews();
    fetchOrders();
    fetchUsers();
    fetchTickets();
  }, [user, navigate]);

  const fetchTickets = () => {
    fetch("/api/admin/tickets", {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        if (selectedTicket) {
          const updated = list.find((item: any) => item.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      })
      .catch(() => setTickets([]));
  };

  const fetchUsers = () => {
    fetch("/api/admin/users", {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  };

  const fetchProxies = () => {
    fetch("/api/proxies", {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setProxies(Array.isArray(data) ? data : []))
      .catch(() => setProxies([]));
  };

  const fetchReviews = () => {
    fetch("/api/admin/reviews", {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  };

  const fetchOrders = () => {
    fetch("/api/admin/orders", {
      headers: getAdminHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  };

  const updateProxyStatus = async (id: string, status: string) => {
    await fetch(`/api/proxies/${id}/status`, {
      method: "PATCH",
      headers: getAdminHeaders(true),
      body: JSON.stringify({ status }),
    });
    fetchProxies();
  };

  const updateReviewInfo = async (id: string, payload: any) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: getAdminHeaders(true),
      body: JSON.stringify(payload),
    });
    fetchReviews();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: getAdminHeaders(true),
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const handleAssignOrderKey = async (orderId: string) => {
    if (!assignKeyInput.trim()) {
      toast.error("Please enter the product key or item credentials.");
      return;
    }
    setIsAssigningKey(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: "POST",
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          itemKey: assignKeyInput.trim(),
          itemNotes: assignNotesInput.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("Item key assigned and order marked Completed!");
        setAssignKeyInput("");
        setAssignNotesInput("");
        fetchOrders();
        if (selectedOrderForModal) {
          setSelectedOrderForModal({
            ...selectedOrderForModal,
            status: "Completed",
            assignedItemKey: assignKeyInput.trim(),
            assignedItemNotes: assignNotesInput.trim(),
          });
        }
      } else {
        toast.error(data.error || "Failed to assign item key.");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setIsAssigningKey(false);
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    const amountNum = parseFloat(refundAmountInput);
    setIsRefundingOrder(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          amount: isNaN(amountNum) ? undefined : amountNum,
          reason: "Admin order refund to store credit",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(data.message || "Refund issued to customer wallet!");
        setRefundAmountInput("");
        fetchOrders();
        if (selectedOrderForModal) {
          setSelectedOrderForModal({
            ...selectedOrderForModal,
            status: "Refunded",
          });
        }
      } else {
        toast.error(data.error || "Failed to refund order.");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setIsRefundingOrder(false);
    }
  };

  const handleCreditUserWallet = async () => {
    if (!selectedUserForWallet) return;
    const amount = parseFloat(walletCreditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid credit amount.");
      return;
    }
    setIsCreditingWallet(true);
    try {
      const uid = selectedUserForWallet.userId || selectedUserForWallet.id;
      const res = await fetch(`/api/admin/users/${uid}/wallet-credit`, {
        method: "POST",
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          amount,
          reason: walletCreditReason || "Admin store credit",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(data.message || "Wallet credit applied successfully!");
        setSelectedUserForWallet(null);
        setWalletCreditAmount("");
        setWalletCreditReason("");
      } else {
        toast.error(data.error || "Failed to apply credit.");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setIsCreditingWallet(false);
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${id}/status`, {
        method: "PATCH",
        headers: getAdminHeaders(true),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Ticket status updated to ${status}`);
        fetchTickets();
      } else {
        toast.error("Failed to update ticket status");
      }
    } catch {
      toast.error("Failed to update ticket status");
    }
  };

  const sendTicketReply = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: getAdminHeaders(true),
        body: JSON.stringify({
          sender: "admin",
          senderName: user?.displayName || user?.name || "Admin Support",
          senderRole: "Administrator",
          text: ticketReply.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setTicketReply("");
        fetchTickets();
        toast.success("Reply posted to customer!");
      } else {
        toast.error("Failed to send reply");
      }
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const [messageData, setMessageData] = useState({
    userId: "",
    subject: "",
    message: "",
    type: "Announcement",
  });

  const updateUserStatus = (userId: string, status: string) => {
    fetch(`/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Id": user?.id || "",
      },
      body: JSON.stringify({ status }),
    })
      .then(() => fetchUsers())
      .catch((err) => toast.error("Failed to update user"));
  };

  const updateUsername = (userId: string) => {
    const newUsername = prompt("Enter new username:");
    if (!newUsername) return;
    
    fetch(`/api/admin/users/${userId}/username`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Id": user?.id || "",
      },
      body: JSON.stringify({ username: newUsername }),
    })
      .then(() => fetchUsers())
      .catch((err) => toast.error("Failed to update user"));
  };

  const createManualOrder = () => {
    const itemName = prompt("Enter item name:");
    const priceStr = prompt("Enter price:");
    if (!itemName || !priceStr) return;
    const price = parseFloat(priceStr);
    
    fetch(`/api/admin/orders`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Id": user?.id || "",
      },
      body: JSON.stringify({
        items: [{ id: "custom_invoice", name: itemName, price: price, quantity: 1, product: { name: itemName, price: price, id: "custom" } }],
        price: price
      }),
    })
      .then(res => res.json())
      .then(data => {
        toast.success("Order Created");
        prompt("Order Link (copy this to send to customer):", `${window.location.origin}/store/custom?name=${encodeURIComponent(itemName)}&price=${price}`);
      })
      .catch((err) => toast.error("Failed to create order"));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-User-Id": user?.id || "",
      },
      body: JSON.stringify(messageData),
    });
    toast.success("Message sent successfully!");
    setMessageData({
      userId: "",
      subject: "",
      message: "",
      type: "Announcement",
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-md w-full p-8 border border-white/10 rounded-2xl bg-[#0a0a0a] text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Access Denied</h1>
            <p className="text-sm text-zinc-400">
              You do not have the required administrator privileges to view this page.
            </p>
          </div>
          <Link
            to="/auth"
            className="inline-block w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const totalUsersCount = users.length;
  const completedOrders = orders.filter((o) => o.status === "Completed");
  const totalRev = completedOrders.reduce((sum, o) => sum + (o.price || o.total || 0), 0);
  const formattedRevenue = formatPrice(totalRev);
  const openTicketsCount = tickets.filter(
    (t) => t.status === "Open" || t.status === "In_Progress"
  ).length;

  const stats = [
    {
      label: "Total Users",
      value: totalUsersCount.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Total Revenue",
      value: formattedRevenue,
      icon: ShoppingBag,
      color: "text-emerald-500",
    },
    {
      label: "Pending Orders",
      value: orders
        .filter((o) =>
          ["Preparing", "To Pay", "Verify Payment"].includes(o.status),
        )
        .length.toString(),
      icon: ListOrdered,
      color: "text-amber-500",
    },
    {
      label: "Active Tickets",
      value: `${openTicketsCount} open`,
      icon: LifeBuoy,
      color: "text-purple-400",
    },
  ];

  const chartData = [
    { name: "Mon", revenue: 4000, orders: 24 },
    { name: "Tue", revenue: 3000, orders: 13 },
    { name: "Wed", revenue: 2000, orders: 98 },
    { name: "Thu", revenue: 2780, orders: 39 },
    { name: "Fri", revenue: 1890, orders: 48 },
    { name: "Sat", revenue: 2390, orders: 38 },
    { name: "Sun", revenue: 3490, orders: 43 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Manage D32.Store operations, products, and users.
          </p>
        </div>

        <SystemStatusWidget />

        <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 self-start lg:self-auto gap-1">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "catalog"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Brands & Products</span>
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "operations"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Operations</span>
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "tickets"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support Tickets</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white leading-none">
                {openTicketsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "diagnostics"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <AdminCatalogManager />
      ) : activeTab === "diagnostics" ? (
        <div className="space-y-8">
          <DbDiagnostics />
          <DashboardMonitoring />
        </div>
      ) : activeTab === "tickets" ? (
        <div className="space-y-6">
          {/* Top Status Filters and Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {["All", "Open", "In_Progress", "Answered", "Closed"].map((st) => {
                const count = st === "All" 
                  ? tickets.length 
                  : tickets.filter((t) => t.status === st).length;
                const isCurrent = ticketFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-white text-black shadow-md"
                        : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{st === "In_Progress" ? "In Progress" : st}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isCurrent ? "bg-black/20 text-black" : "bg-white/10 text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Tickets Split Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tickets Master List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Support Tickets</span>
                  <span className="text-xs text-zinc-400 font-normal">
                    {tickets.filter((t) => ticketFilter === "All" || t.status === ticketFilter).length} tickets
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {tickets.filter((t) => ticketFilter === "All" || t.status === ticketFilter).length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                      No tickets found for this filter.
                    </div>
                  ) : (
                    tickets
                      .filter((t) => ticketFilter === "All" || t.status === ticketFilter)
                      .map((ticket) => {
                        const isSelected = selectedTicket?.id === ticket.id;
                        const messagesCount = Array.isArray(ticket.messages) ? ticket.messages.length : 0;
                        const lastMsg = messagesCount > 0 ? ticket.messages[messagesCount - 1] : null;

                        return (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? "bg-white/10 border-white/30 shadow-md"
                                : "bg-[#111] border-white/5 hover:border-white/15 hover:bg-[#161616]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                ticket.status === "Open"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                  : ticket.status === "In_Progress"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                  : ticket.status === "Answered"
                                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                  : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20"
                              }`}>
                                {ticket.status === "In_Progress" ? "In Progress" : ticket.status}
                              </span>

                              <span className="text-[11px] text-zinc-500 font-mono">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
                              {ticket.subject}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                              <span className="truncate max-w-[180px]">
                                {ticket.userEmail || ticket.username || "Customer"}
                              </span>
                              <span className="text-zinc-500 shrink-0">
                                {messagesCount} {messagesCount === 1 ? "msg" : "msgs"}
                              </span>
                            </div>

                            {lastMsg && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1 italic mt-1 border-t border-white/5 pt-1">
                                {lastMsg.sender === "admin" ? "Agent: " : "User: "}
                                {lastMsg.text}
                              </p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ticket Conversation & Agent Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedTicket ? (
                <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-6">
                  {/* Ticket Header & Status Switcher */}
                  <div className="border-b border-white/10 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Ticket ID: {selectedTicket.id}
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                          {selectedTicket.subject}
                        </h2>
                      </div>

                      {/* Status changer buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["Open", "In_Progress", "Answered", "Closed"].map((st) => (
                          <button
                            key={st}
                            onClick={() => updateTicketStatus(selectedTicket.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              selectedTicket.status === st
                                ? "bg-white text-black shadow-sm"
                                : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {st === "In_Progress" ? "In Progress" : st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span>Customer: <strong className="text-white">{selectedTicket.username || "Customer"}</strong></span>
                      {selectedTicket.userEmail && (
                        <span>• Email: <strong className="text-white">{selectedTicket.userEmail}</strong></span>
                      )}
                      {selectedTicket.category && (
                        <span>• Category: <strong className="text-white">{selectedTicket.category}</strong></span>
                      )}
                      {selectedTicket.priority && (
                        <span>• Priority: <strong className="text-white">{selectedTicket.priority}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Messages Timeline Thread */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {Array.isArray(selectedTicket.messages) && selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map((msg: any, idx: number) => {
                        const isAdmin = msg.sender === "admin";
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl max-w-[85%] text-xs sm:text-sm ${
                              isAdmin
                                ? "ml-auto bg-purple-600/20 border border-purple-500/30 text-white"
                                : "mr-auto bg-[#141414] border border-white/10 text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1 text-[10px]">
                              <span className={`font-bold ${isAdmin ? "text-purple-300" : "text-zinc-400"}`}>
                                {msg.senderName || (isAdmin ? "Support Agent" : "Customer")}
                              </span>
                              <span className="text-zinc-500">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-xs">
                        No messages in this ticket thread yet.
                      </div>
                    )}
                  </div>

                  {/* Reply Composer Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendTicketReply(selectedTicket.id);
                    }}
                    className="border-t border-white/10 pt-4 space-y-3"
                  >
                    <textarea
                      required
                      rows={3}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Type official response to customer..."
                      className="w-full p-3.5 rounded-xl bg-[#111] border border-white/10 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 resize-none transition-colors"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateTicketStatus(selectedTicket.id, "Answered")}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-medium hover:bg-blue-500/25 cursor-pointer transition-colors"
                        >
                          Mark as Answered
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTicketStatus(selectedTicket.id, "Closed")}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-medium hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          Close Ticket
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={sendingReply || !ticketReply.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-[#0a0a0a] border border-white/10 text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Select a Ticket</h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Select a ticket from the list on the left to read the customer's request, inspect previous messages, and send an official response.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-400">
                {s.label}
              </span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6">
          Recent Revenue & Order Volume
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff10"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#ffffff50"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#ffffff50"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#ffffff50"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  borderColor: "#ffffff10",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#10b981" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 lg:min-h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-6">
              Send Notifications & Messages
            </h3>
            <form onSubmit={sendMessage} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  User ID (Leave empty for global)
                </label>
                <input
                  type="text"
                  value={messageData.userId}
                  onChange={(e) =>
                    setMessageData({ ...messageData, userId: e.target.value })
                  }
                  className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Optional: Target specific user"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Type
                  </label>
                  <select
                    value={messageData.type}
                    onChange={(e) =>
                      setMessageData({ ...messageData, type: e.target.value })
                    }
                    className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Alert">Security Alert</option>
                    <option value="Notification">Notification</option>
                    <option value="Reply">Direct Message / Reply</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={messageData.subject}
                    onChange={(e) =>
                      setMessageData({
                        ...messageData,
                        subject: e.target.value,
                      })
                    }
                    className="w-full h-11 px-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageData.message}
                  onChange={(e) =>
                    setMessageData({ ...messageData, message: e.target.value })
                  }
                  className="w-full p-4 rounded-xl bg-[#111] border border-white/10 text-white focus:outline-none focus:border-white/30 transition-colors resize-y custom-scrollbar"
                ></textarea>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 lg:min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Customer Orders & Fulfillment ({orders.length})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verify payments, assign item keys to Preparing orders, manage refunds to wallet.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchOrders}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Orders</span>
              </button>
            </div>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-zinc-500 text-sm">No orders found.</p>
              ) : (
                orders.map((order) => {
                  const rawId = order.orderId || order.id;
                  const displayId = order.displayId || (rawId.startsWith("D32-") ? rawId : `D32-${rawId.substring(0, 6).toUpperCase()}`);
                  const isPaid = order.isPaid || order.status === "Completed" || order.status === "Preparing" || order.paymentStatus === "completed" || order.paymentStatus === "paid_with_wallet";
                  const hasKeys = Boolean(order.assignedItemKey);

                  return (
                    <div
                      key={rawId}
                      className="p-4 rounded-xl bg-[#111] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/15 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-white bg-white/10 px-2 py-0.5 rounded font-bold">
                            #{displayId}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {new Date(order.date || order.createdAt).toLocaleDateString()}
                          </span>
                          {/* Payment status badge */}
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Paid ({order.paymentStatus || "verified"})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Payment Pending
                            </span>
                          )}

                          {/* Key assignment status */}
                          {hasKeys ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Key Assigned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Awaiting Key Assignment
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-300">
                          <span className="text-white font-bold text-sm">
                            {formatPrice(order.price || order.total || 0)}
                          </span>
                          <span>•</span>
                          <span>Customer: <strong className="text-white">{order.customerEmail || order.customerUsername || "Guest"}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForModal(order);
                            setAssignKeyInput(order.assignedItemKey || "");
                            setAssignNotesInput(order.assignedItemNotes || "");
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Inspect & Fulfill
                        </button>

                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(rawId, e.target.value)
                          }
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                            order.status === "Completed"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : order.status === "Preparing"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : order.status === "Cancelled"
                              ? "bg-red-500/10 border-red-500/20 text-red-400"
                              : order.status === "Refunded"
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          }`}
                        >
                          <option value="Pending" className="bg-[#111] text-white">Pending</option>
                          <option value="Preparing" className="bg-[#111] text-white">Preparing</option>
                          <option value="Completed" className="bg-[#111] text-white">Completed</option>
                          <option value="Cancelled" className="bg-[#111] text-white">Cancelled</option>
                          <option value="Refunded" className="bg-[#111] text-white">Refunded</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 lg:min-h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-6">
              Proxy Submissions Review
            </h3>
            <div className="space-y-4">
              {proxies.filter(
                (p) =>
                  p.status === "Pending" || p.status === "Changes Requested",
              ).length === 0 ? (
                <p className="text-zinc-500 text-sm">
                  No pending proxy reviews.
                </p>
              ) : (
                proxies
                  .filter((p) =>
                    ["Pending", "Changes Requested"].includes(p.status),
                  )
                  .map((proxy) => {
                    const proxyId = proxy.proxyId || proxy.id || proxy._id;
                    return (
                      <div
                        key={proxyId}
                        className="p-4 rounded-xl bg-[#111] border border-white/5 flex flex-col gap-4"
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-white/10 text-white">
                                {proxy.platform}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  proxy.status === "Pending"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {proxy.status}
                              </span>
                            </div>
                            <h4 className="text-white font-semibold text-lg">
                              {proxy.username}
                            </h4>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {proxy.bin}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Asking Price
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-zinc-500">Followers:</span>{" "}
                            <span className="text-white">
                              {proxy.followers || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Condition:</span>{" "}
                            <span className="text-white">{proxy.condition}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">OG Email:</span>{" "}
                            <span className="text-white">
                              {proxy.ogEmail ? "Yes" : "No"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">C/O:</span>{" "}
                            <span className="text-white">{proxy.co}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateProxyStatus(proxyId, "Approved")
                            }
                            className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() =>
                              updateProxyStatus(proxyId, "Rejected")
                            }
                            className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() =>
                              updateProxyStatus(proxyId, "Changes Requested")
                            }
                            className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <AlertCircle className="w-4 h-4" /> Request Changes
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-6">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("catalog")}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-sm font-medium text-zinc-300">
                  Add New Product / Edit Catalog
                </span>
                <span className="text-zinc-500 group-hover:text-white transition-colors">
                  →
                </span>
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-sm font-medium text-zinc-300">
                  Support Tickets ({openTicketsCount} active)
                </span>
                <span className="text-zinc-500 group-hover:text-white transition-colors">
                  →
                </span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("admin-user-management");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-colors cursor-pointer group"
              >
                <span className="text-sm font-medium text-zinc-300">
                  Manage Users ({users.length})
                </span>
                <span className="text-zinc-500 group-hover:text-white transition-colors">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 mt-6 lg:min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6">
            Review Moderation
          </h3>
          <div className="space-y-4">
            {reviews.filter((r) => r.approvalStatus === "Pending" || r.reported)
              .length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No pending or reported reviews.
              </p>
            ) : (
              reviews
                .filter((r) => r.approvalStatus === "Pending" || r.reported)
                .map((review) => (
                  <div
                    key={review.reviewId}
                    className={`p-4 rounded-xl border flex flex-col gap-4 ${review.reported ? "bg-red-500/5 border-red-500/20" : "bg-[#111] border-white/5"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium">
                            {review.username}
                          </span>
                          <span className="text-zinc-500 text-xs">
                            Product: {review.productId}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              review.approvalStatus === "Pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : review.approvalStatus === "Approved"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {review.approvalStatus}
                          </span>
                        </div>
                        {review.reported && (
                          <div className="mb-2 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                              <strong className="block">Reported Review</strong>
                              <span className="opacity-80">
                                Reason: {review.reportReason}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-zinc-300 text-sm italic py-2 border-l-2 border-white/10 pl-3">
                          "{review.reviewText}"
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-zinc-400 text-sm border-r border-white/10 pr-2 mr-2">
                            Rating: {review.rating}/5
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="text-emerald-400 text-sm">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt="attached"
                            className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2 pt-4 border-t border-white/5 border-dashed">
                      {review.approvalStatus !== "Approved" && (
                        <button
                          onClick={() =>
                            updateReviewInfo(review.reviewId, {
                              approvalStatus: "Approved",
                            })
                          }
                          className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      )}
                      {review.approvalStatus !== "Rejected" && (
                        <button
                          onClick={() =>
                            updateReviewInfo(review.reviewId, {
                              approvalStatus: "Rejected",
                            })
                          }
                          className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      )}
                      {review.reported && (
                        <button
                          onClick={() =>
                            updateReviewInfo(review.reviewId, {
                              reported: false,
                            })
                          }
                          className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-sm transition-colors flex items-center justify-center gap-1.5 ml-auto"
                        >
                          Dismiss Report
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div id="admin-user-management" className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            User Management ({users.length})
          </h3>
          <button
            onClick={createManualOrder}
            className="px-4 py-2 bg-[#5C24FF] text-white rounded-lg hover:bg-[#4A1DCC] text-sm font-medium transition-colors"
          >
            Create Manual Invoice Limit
          </button>
        </div>
        <div className="space-y-4">
          {users.map(u => {
            const currentUserId = u.userId || u.id || u._id;
            return (
              <div key={currentUserId} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl gap-4">
                <div>
                  <p className="text-white font-medium">{u.username} <span className="text-xs ml-2 text-zinc-500">({u.email})</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${u.status === 'Banned' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{u.status || 'Active'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">{u.role}</span>
                    <span className="text-xs text-zinc-500">{u.authProvider}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setSelectedUserForWallet(u);
                      setWalletCreditAmount("50");
                      setWalletCreditReason("Store credit bonus");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                  >
                    Credit Wallet
                  </button>
                  <button
                    onClick={() => updateUsername(currentUserId)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium transition-colors"
                  >
                    Change Username
                  </button>
                  {u.status === 'Banned' ? (
                    <button
                      onClick={() => updateUserStatus(currentUserId, 'Active')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUserStatus(currentUserId, 'Banned')}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
                    >
                      Ban User
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* ---------------- ORDER DETAILS & FULFILLMENT MODAL ---------------- */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0e0f13] border border-white/20 rounded-3xl p-6 sm:p-7 text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white">
                    #{selectedOrderForModal.displayId || selectedOrderForModal.orderId}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedOrderForModal.status === "Completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : selectedOrderForModal.status === "Preparing"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {selectedOrderForModal.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Placed on {new Date(selectedOrderForModal.createdAt || selectedOrderForModal.date).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment & Security Verification Strip */}
            <div className="p-4 rounded-2xl bg-[#14161d] border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Payment Verification (Server-Side)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-zinc-500 block">Gateway Status:</span>
                  <strong className="text-white capitalize">
                    {selectedOrderForModal.paymentStatus || "completed"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Intent ID:</span>
                  <span className="font-mono text-zinc-300 truncate block">
                    {selectedOrderForModal.ziinaIntentId || "Direct"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Customer:</span>
                  <span className="text-zinc-300 truncate block">
                    {selectedOrderForModal.customerEmail || selectedOrderForModal.customerUsername || selectedOrderForModal.userId}
                  </span>
                </div>
              </div>

              {selectedOrderForModal.paymentError && (
                <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Reported Gateway Error: {selectedOrderForModal.paymentError}</span>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Purchased Items</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {(Array.isArray(selectedOrderForModal.cartItems) ? selectedOrderForModal.cartItems : []).map((it: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white/[0.04] flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{it.name || "Digital Item"}</span>
                    <span className="text-zinc-300 font-bold">{formatPrice(it.price || 0)} (Qty: {it.quantity || 1})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ASSIGN PURCHASED ITEM KEY & COMPLETE ORDER */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Assign Product Key / Credentials</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  Visible ONLY to this customer upon Completion
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Product License Key / Account Credentials
                </label>
                <textarea
                  rows={2}
                  value={assignKeyInput}
                  onChange={(e) => setAssignKeyInput(e.target.value)}
                  placeholder="e.g. D32-PREMIUM-XXXX-XXXX or Account: user@domain.com / Password: xyz"
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/15 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-400 custom-scrollbar"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Delivery Notes / Activation Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={assignNotesInput}
                  onChange={(e) => setAssignNotesInput(e.target.value)}
                  placeholder="e.g. Please log in and change security settings within 24 hours."
                  className="w-full h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                type="button"
                disabled={isAssigningKey}
                onClick={() => handleAssignOrderKey(selectedOrderForModal.orderId || selectedOrderForModal.id)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isAssigningKey ? "Assigning & Dispatching Resend Email..." : "Assign Item & Mark Order Completed"}
                </span>
              </button>
            </div>

            {/* REFUND TO WALLET ACTION */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Refund as D32 Wallet Store Credit
              </span>
              <p className="text-[11px] text-zinc-400">
                Deposit store credit directly into the customer's wallet for instant reuse on their next purchase.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Amount (Default: ${formatPrice(selectedOrderForModal.price || 0)})`}
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isRefundingOrder}
                  onClick={() => handleRefundOrder(selectedOrderForModal.orderId || selectedOrderForModal.id)}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRefundingOrder ? "Processing..." : "Refund to Wallet"}
                </button>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setActiveTab("tickets");
                  setSelectedOrderForModal(null);
                }}
                className="text-zinc-400 hover:text-white flex items-center gap-1 underline cursor-pointer"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Jump to Customer Tickets</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- WALLET CREDIT MODAL ---------------- */}
      {selectedUserForWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e0f13] border border-white/20 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Credit Customer Wallet</h3>
              <button
                type="button"
                onClick={() => setSelectedUserForWallet(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Apply a store credit bonus or refund to{" "}
              <strong className="text-white">{selectedUserForWallet.username}</strong> ({selectedUserForWallet.email}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Credit Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={walletCreditAmount}
                  onChange={(e) => setWalletCreditAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={walletCreditReason}
                  onChange={(e) => setWalletCreditReason(e.target.value)}
                  placeholder="e.g. Promotional credit / VIP refund"
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForWallet(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isCreditingWallet || !walletCreditAmount}
                  onClick={handleCreditUserWallet}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isCreditingWallet ? "Applying..." : "Confirm Wallet Credit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
