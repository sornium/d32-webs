import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Package, 
  Settings, 
  Tag, 
  User, 
  ShoppingBag, 
  LogOut, 
  Check, 
  Copy, 
  ShieldCheck,
  Wallet,
  LifeBuoy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store";
import { useTranslation } from "../lib/i18n";
import AccountOrders, { OrderItem } from "../components/account/AccountOrders";
import AccountProfileSettings from "../components/account/AccountProfileSettings";
import AccountWallet from "../components/account/AccountWallet";
import AccountTickets from "../components/account/AccountTickets";
import DashboardSell from "./DashboardSell";
import toast from "react-hot-toast";

const TABS = [
  { id: "orders", label: "My Orders", icon: Package },
  { id: "wallet", label: "Store Wallet", icon: Wallet },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "sell", label: "Sell Account", icon: Tag },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const { t } = useTranslation();

  // Route tab parsing (/dashboard/orders, /dashboard/wallet, /dashboard/tickets, /dashboard/settings, /dashboard/sell, /account)
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const rawTab = pathSegments[1] || "orders";
  const activeTab =
    rawTab === "sell"
      ? "sell"
      : rawTab === "wallet"
      ? "wallet"
      : rawTab === "tickets"
      ? "tickets"
      : rawTab === "settings" || rawTab === "profile"
      ? "settings"
      : "orders";

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoadingOrders(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch(`/api/user/orders?userId=${encodeURIComponent(user.id)}`, {
        headers: {
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch user orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const handleSelectTab = (tabId: string) => {
    const basePath = location.pathname.startsWith("/account") ? "/account" : "/dashboard";
    navigate(`${basePath}/${tabId}`);
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success(t("User ID copied to clipboard!", "User ID copied to clipboard!"));
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!user) return null;

  const displayName = user.displayName || user.name || "User";
  const username = user.username ? `@${user.username}` : user.email?.split("@")[0] ? `@${user.email.split("@")[0]}` : "@member";

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Account Identity Topbar Banner */}
      <header className="rounded-3xl md:rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] p-3.5 sm:py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-16 bg-white/15 rounded-full blur-2xl pointer-events-none" />

        {/* User Identity Info */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {user.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-white/25 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
                <User className="w-5 h-5 text-white/80" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/20 bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{user.role === "admin" ? t("Administrator", "Administrator") : t("Verified Buyer", "Verified Buyer")}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
              <span className="font-mono text-white/70">{username}</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-mono transition-all cursor-pointer"
                title="Copy User ID"
              >
                <span>ID: {user.id.substring(0, 8)}...</span>
                {copiedId ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-white/40" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons (Styled like Topbar Action Pills) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/store"
            className="inline-flex h-9 px-4 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 text-white text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t("Store", "Store")}</span>
          </Link>

          <button
            type="button"
            onClick={() => setUser(null, null)}
            className="inline-flex h-9 px-3.5 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 hover:border-rose-500/40 hover:bg-rose-500/15 text-white/80 hover:text-rose-200 text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
            title="Sign out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("Sign Out", "Sign Out")}</span>
          </button>
        </div>
      </header>

      {/* Floating Pill Tab Navigation Bar (Styled EXACTLY like Topbar) */}
      <div className="flex justify-start sm:justify-center overflow-x-auto custom-scrollbar pb-1 px-1 -mx-2 sm:mx-0">
        <nav className="inline-flex p-1 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] gap-1 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const label =
              tab.id === "orders"
                ? t("My Orders", "My Orders")
                : tab.id === "wallet"
                ? t("Wallet", "Store Wallet")
                : tab.id === "tickets"
                ? t("Support", "Support")
                : tab.id === "settings"
                ? t("Settings", "Settings")
                : t("Sell Account", "Sell Account");

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
                  isActive
                    ? "text-white bg-white/15 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {tab.id === "orders" && orders.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/60"
                  }`}>
                    {orders.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main View Panel */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "orders" && (
              <AccountOrders
                orders={orders}
                loading={loadingOrders}
                onRefresh={fetchOrders}
              />
            )}

            {activeTab === "wallet" && (
              <AccountWallet />
            )}

            {activeTab === "tickets" && (
              <AccountTickets />
            )}

            {activeTab === "settings" && (
              <AccountProfileSettings />
            )}

            {activeTab === "sell" && (
              <div className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-24 bg-white/15 rounded-full blur-3xl pointer-events-none" />
                <DashboardSell />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
