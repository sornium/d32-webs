import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Package, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  Key, 
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  LifeBuoy,
  FileText
} from "lucide-react";
import OrderInvoiceModal from "../OrderInvoiceModal";
import { useCurrency } from "../../lib/currency";
import { useTranslation } from "../../lib/i18n";
import toast from "react-hot-toast";

export interface OrderItem {
  id: string;
  orderId?: string;
  displayId?: string;
  createdAt: string;
  price: number;
  currency?: string;
  status: string;
  paymentStatus?: string;
  ziinaIntentId?: string;
  cartItems?: any[];
  productId?: string;
  productName?: string;
  warranty?: boolean;
  warrantyLabel?: string;
  assignedItemKey?: string | null;
  assignedItemNotes?: string | null;
  assignedAt?: string | null;
  canAccessKey?: boolean;
}

interface AccountOrdersProps {
  orders: OrderItem[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_FILTERS = [
  "All", 
  "Preparing", 
  "Completed", 
  "To Pay", 
  "Cancelled"
];

export default function AccountOrders({
  orders,
  loading,
  onRefresh
}: AccountOrdersProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const status = String(order.status || "Pending");
    const matchesFilter = 
      activeFilter === "All" ||
      (activeFilter === "Preparing" && status.toLowerCase().includes("preparing")) ||
      (activeFilter === "Completed" && status.toLowerCase().includes("completed")) ||
      (activeFilter === "To Pay" && (status.toLowerCase().includes("pending") || status.toLowerCase().includes("pay"))) ||
      (activeFilter === "Cancelled" && (status.toLowerCase().includes("cancel") || status.toLowerCase().includes("refund"))) ||
      status.toLowerCase() === activeFilter.toLowerCase();

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const orderIdMatch = (order.id || "").toLowerCase().includes(query) || (order.orderId || "").toLowerCase().includes(query) || (order.displayId || "").toLowerCase().includes(query);
    const itemMatch = (order.cartItems || []).some((item: any) => 
      (item.product?.name || item.name || "").toLowerCase().includes(query)
    );
    const directNameMatch = (order.productName || "").toLowerCase().includes(query);

    return orderIdMatch || itemMatch || directNameMatch;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "Pending").toLowerCase();
    if (s.includes("completed")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    }
    if (s.includes("preparing")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Preparing</span>
        </span>
      );
    }
    if (s.includes("cancel") || s.includes("refund")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
          <XCircle className="w-3.5 h-3.5" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Payment</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search + Status Filter Pills + Refresh */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="p-1 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
          {STATUS_FILTERS.map((filter) => {
            const count = orders.filter((o) => {
              const s = (o.status || "Pending").toLowerCase();
              if (filter === "All") return true;
              if (filter === "Preparing") return s.includes("preparing");
              if (filter === "Completed") return s.includes("completed");
              if (filter === "To Pay") return s.includes("pending") || s.includes("pay");
              if (filter === "Cancelled") return s.includes("cancel") || s.includes("refund");
              return s === filter.toLowerCase();
            }).length;

            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  isActive
                    ? "text-white bg-white/20 border border-white/30 font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                }`}
              >
                <span>{filter}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/60"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID or item..."
              className="w-full h-9 pl-8 pr-3 rounded-full bg-white/[0.08] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/35 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-3 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-white/60 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-white/40" />
          <span>Loading orders from database...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.06] border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-white/60">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-white/60 max-w-sm mx-auto">
            {searchQuery
              ? "No orders match your search criteria."
              : activeFilter !== "All"
              ? `No orders currently in '${activeFilter}' status.`
              : "You haven't placed any orders yet. Visit the store to explore digital goods."}
          </p>
          <Link
            to="/store"
            className="inline-flex px-5 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-md"
          >
            Explore Store
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const rawId = order.orderId || order.id;
            const displayId = order.displayId || (rawId.startsWith("D32-") ? rawId : `D32-${rawId.substring(0, 6).toUpperCase()}`);
            const isCompleted = order.status === "Completed";
            const isPreparing = order.status === "Preparing";
            const isPending = order.status === "Pending";
            const dateStr = new Date(order.createdAt).toLocaleDateString();

            const items = Array.isArray(order.cartItems) && order.cartItems.length > 0 
              ? order.cartItems 
              : [{
                  product: {
                    name: order.productName || "Digital Product",
                    price: order.price,
                  },
                  quantity: 1,
                  warranty: order.warranty,
                  warrantyLabel: order.warrantyLabel
                }];

            return (
              <div
                key={rawId}
                className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-lg overflow-hidden transition-all hover:bg-white/[0.10]"
              >
                {/* Top Summary Bar */}
                <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(displayId, rawId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 text-white text-xs font-mono font-medium transition-all cursor-pointer"
                      title="Click to copy Order ID"
                    >
                      <span className="text-white/40">#</span>
                      <span>{displayId}</span>
                      {copiedId === rawId ? (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/40 shrink-0" />
                      )}
                    </button>

                    <span className="text-xs text-white/50">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                      title="View & Download Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Invoice</span>
                    </button>
                    {getStatusBadge(order.status)}
                    <span className="text-sm sm:text-base font-bold text-white">
                      {formatPrice(order.price)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 sm:px-6 space-y-2.5">
                  {items.map((item: any, idx: number) => {
                    const prodName = item.product?.name || item.name || "Digital Product";
                    const qty = item.quantity || 1;
                    const itemPrice = item.product?.price || item.price || order.price;

                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 py-1">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {prodName}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-white/50">
                            <span>Qty: {qty}</span>
                            <span>•</span>
                            <span>{formatPrice(itemPrice)} ea</span>
                            {item.warranty && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3" />
                                  {item.warrantyLabel || "Warranty Included"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-bold text-white shrink-0">
                          {formatPrice(itemPrice * qty)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* STATUS: PREPARING NOTICE */}
                {isPreparing && (
                  <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-2xl bg-blue-500/[0.08] border border-blue-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
                        <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                        <span>Payment Verified · Order in Preparation</span>
                      </div>
                      <Link
                        to={`/dashboard/tickets?orderId=${encodeURIComponent(order.orderId || order.id)}`}
                        className="text-[11px] font-semibold text-white/70 hover:text-white underline inline-flex items-center gap-1"
                      >
                        <LifeBuoy className="w-3 h-3" />
                        <span>Support Ticket</span>
                      </Link>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your payment has been received and verified. An administrator is currently assigning your specific product credentials. For your privacy, product keys are locked until the admin marks the order ready.
                    </p>
                  </div>
                )}

                {/* STATUS: COMPLETED SECURE DIGITAL VAULT */}
                {isCompleted && (
                  <div className="mx-4 sm:mx-6 mb-4 p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>Product Credentials Vault</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20">
                        Unlocked
                      </span>
                    </div>

                    {order.assignedItemKey ? (
                      <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20 font-mono text-xs text-white flex items-center justify-between gap-2 select-all">
                        <span className="break-all">{order.assignedItemKey}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.assignedItemKey || "", `key-${rawId}`)}
                          className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedId === `key-${rawId}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-white/60">
                        Order marked completed. If you need any assistance, click below to open a ticket.
                      </p>
                    )}

                    {order.assignedItemNotes && (
                      <div className="text-[11px] text-white/70 pt-1">
                        <span className="font-semibold text-white">Instructions: </span>
                        <span>{order.assignedItemNotes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STATUS: PENDING PAYMENT */}
                {isPending && (
                  <div className="p-3 sm:px-6 border-t border-white/10 bg-amber-500/[0.04] flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-300/80">
                      Payment pending verification or completion.
                    </span>
                    <Link
                      to="/cart"
                      className="inline-flex h-8 px-4 items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 transition-all shadow-sm"
                    >
                      Complete Payment
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      <OrderInvoiceModal
        isOpen={Boolean(selectedOrderForInvoice)}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
      />
    </div>
  );
}
