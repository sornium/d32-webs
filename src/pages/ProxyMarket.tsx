import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  BadgeCheck,
  Search,
  ChevronDown,
  Upload,
  AlertTriangle,
  Globe,
  Calendar,
  X,
  Zap,
  Check,
  Shield,
  MessageSquare,
  Instagram,
  Twitter,
  Music,
  Share2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { useTranslation } from "../lib/i18n";
import { useCurrency } from "../lib/currency";
import CheckoutModal from "../components/CheckoutModal";
import toast from "react-hot-toast";

const PLATFORMS = ["TikTok", "Instagram", "Discord", "Twitter/X", "Tellonym"];

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-xl bg-[#121214] border border-white/10 text-white focus:outline-none focus:border-white/40 flex items-center justify-between text-sm transition-colors hover:border-white/20 shadow-sm"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180 text-white" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full top-full mt-2 bg-[#121214] border border-white/10 rounded-xl overflow-hidden py-1 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === opt ? "bg-white/10 text-white font-semibold" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Generates dynamic aesthetic visual styling based on account details
function getAccountVisuals(platform: string, username: string) {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const presets = [
    {
      banner: "from-[#5C24FF] via-[#3F1BB3] to-[#120B2E]",
      avatarColor: "#5C24FF",
      glowColor: "rgba(92, 36, 255, 0.4)",
      desc: "Verified Premium Discord Guild with custom vanity and active gaming community hubs."
    },
    {
      banner: "from-[#E1306C] via-[#C13584] to-[#40132C]",
      avatarColor: "#E1306C",
      glowColor: "rgba(225, 48, 108, 0.4)",
      desc: "Lifestyle & fashion niche Instagram account. Exceptional engagement rate and clean history."
    },
    {
      banner: "from-[#00F2FE] via-[#00A1D6] to-[#012540]",
      avatarColor: "#00F2FE",
      glowColor: "rgba(0, 242, 254, 0.4)",
      desc: "TikTok account with viral short-form tech and music content. Fully ready for Creator Rewards."
    },
    {
      banner: "from-[#FF5E62] via-[#FF9966] to-[#4A1E17]",
      avatarColor: "#FF5E62",
      glowColor: "rgba(255, 94, 98, 0.4)",
      desc: "Premium short/rare username handle. High potential branding assets with robust original support."
    },
    {
      banner: "from-[#11998e] via-[#38ef7d] to-[#0A301E]",
      avatarColor: "#38ef7d",
      glowColor: "rgba(56, 239, 125, 0.4)",
      desc: "High quality curated digital assets with positive organic reach and active audience base."
    }
  ];

  const selected = presets[hash % presets.length];

  // Overlay platform-specific graphics
  let PlatformIcon = Globe;
  let platformLabel = "Social Space";
  let fallbackAvatar = "D32";

  if (platform === "Discord") {
    PlatformIcon = MessageSquare;
    platformLabel = "Discord Guild";
    fallbackAvatar = "DS";
  } else if (platform === "Instagram") {
    PlatformIcon = Instagram;
    platformLabel = "Instagram Profile";
    fallbackAvatar = "IG";
  } else if (platform === "Twitter/X") {
    PlatformIcon = Twitter;
    platformLabel = "Twitter/X Handle";
    fallbackAvatar = "TX";
  } else if (platform === "TikTok") {
    PlatformIcon = Music;
    platformLabel = "TikTok Channel";
    fallbackAvatar = "TT";
  }

  return {
    ...selected,
    PlatformIcon,
    platformLabel,
    avatarText: username ? username.slice(0, 2).toUpperCase() : fallbackAvatar
  };
}

function getPlatformBadgeClasses(platform: string) {
  switch (platform) {
    case "TikTok":
      return "bg-zinc-900/90 text-[#00f2fe] border-[#00f2fe]/20 backdrop-blur-md";
    case "Instagram":
      return "bg-zinc-900/90 text-[#e1306c] border-[#e1306c]/20 backdrop-blur-md";
    case "Discord":
      return "bg-zinc-900/90 text-[#5865f2] border-[#5865f2]/20 backdrop-blur-md";
    case "Twitter/X":
    case "Twitter":
      return "bg-zinc-900/90 text-white border-white/15 backdrop-blur-md";
    default:
      return "bg-zinc-900/90 text-zinc-300 border-white/10 backdrop-blur-md";
  }
}

export default function ProxyMarket() {
  const [proxies, setProxies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useStore();
  const { t } = useTranslation();
  const { currency, format, convert } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState(t("All Platforms", "All Platforms"));
  const [filterSort, setFilterSort] = useState(t("Sort by: Newest", "Sort by: Newest"));

  // State for account details modal and checkout flow
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/proxies")
      .then((res) => res.json())
      .then((data) => {
        // filter out only approved proxies to show
        setProxies(data.filter((p: any) => p.status === "Approved"));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Could not fetch proxies", err);
        setIsLoading(false);
      });
  }, []);

  const handleSellClick = () => {
    if (user) {
      navigate("/dashboard/sell");
    } else {
      navigate("/auth");
    }
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("Please sign up or log in to submit a bid", "Please sign up or log in to submit a bid"));
      navigate("/auth");
      return;
    }
    const bidNum = parseFloat(bidAmount);
    if (!bidNum || isNaN(bidNum)) {
      toast.error(t("Please enter a valid bid amount", "Please enter a valid bid amount"));
      return;
    }
    
    // Simulate bid success
    toast.success(
      t(`Bid of ${currency} ${bidNum.toFixed(2)} submitted successfully! The seller has been notified.`, 
        `Bid of ${currency} ${bidNum.toFixed(2)} submitted successfully! The seller has been notified.`)
    );
    setBidAmount("");
  };

  // Helper to parse numerical value from standard string fields like "$450"
  const getNumericPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
  };

  // Filter and sort listings
  const filteredProxies = proxies
    .filter((p) => {
      // Platform filter
      if (filterPlatform !== t("All Platforms", "All Platforms") && p.platform !== filterPlatform) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const usernameMatch = p.username?.toLowerCase().includes(query);
        const platformMatch = p.platform?.toLowerCase().includes(query);
        const condMatch = p.condition?.toLowerCase().includes(query);
        return usernameMatch || platformMatch || condMatch;
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = getNumericPrice(a.bin);
      const priceB = getNumericPrice(b.bin);

      if (filterSort === t("Price: Low to High", "Price: Low to High")) {
        return priceA - priceB;
      }
      if (filterSort === t("Price: High to Low", "Price: High to Low")) {
        return priceB - priceA;
      }
      // Default: Newest
      return new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime();
    });

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mb-2">
            {t("Proxy & Social Marketplace", "Proxy & Social Marketplace")}
          </h1>
          <p className="text-zinc-400">
            {t("Secure premium social media handles, active gaming servers, and high-quality digital listings.", "Secure premium social media handles, active gaming servers, and high-quality digital listings.")}
          </p>
        </div>
        <button
          onClick={handleSellClick}
          className="px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {t("Sell Your Account", "Sell Your Account")}
        </button>
      </div>

      {/* Filters & Search Input */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-y border-white/10">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search handles, servers, or tags...", "Search handles, servers, or tags...")}
            className="w-full h-11 bg-[#121214] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>
        <div className="w-48 z-40 relative">
          <CustomSelect
            value={filterPlatform}
            onChange={setFilterPlatform}
            options={[t("All Platforms", "All Platforms"), ...PLATFORMS]}
          />
        </div>
        <div className="w-48 z-40 relative">
          <CustomSelect
            value={filterSort}
            onChange={setFilterSort}
            options={[
              t("Sort by: Newest", "Sort by: Newest"),
              t("Price: Low to High", "Price: Low to High"),
              t("Price: High to Low", "Price: High to Low"),
            ]}
          />
        </div>
      </div>

      {/* Accounts & Proxies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((sk) => (
            <div
              key={sk}
              className="rounded-2xl bg-[#121214] border border-white/10 flex flex-col h-[340px] overflow-hidden"
            >
              <div className="h-24 bg-white/5 animate-pulse" />
              <div className="p-6 flex-grow space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 -mt-12 border-4 border-[#121214] animate-pulse" />
                <div className="w-1/2 h-6 bg-white/10 rounded animate-pulse" />
                <div className="space-y-2 pt-2">
                  <div className="w-full h-4 bg-white/5 rounded animate-pulse" />
                  <div className="w-2/3 h-4 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProxies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 bg-[#121214] border border-white/10 rounded-2xl p-8">
            <AlertTriangle className="w-8 h-8 text-white/80 mx-auto mb-3" />
            <p className="text-white font-medium">{t("No matches found in the marketplace.", "No matches found in the marketplace.")}</p>
            <p className="text-sm text-zinc-400 mt-1">{t("Try adjusting your search filters or check back later.", "Try adjusting your search filters or check back later.")}</p>
          </div>
        ) : (
          filteredProxies.map((acc, i) => {
            const visuals = getAccountVisuals(acc.platform, acc.username);
            return (
              <div
                key={i}
                onClick={() => setSelectedAccount(acc)}
                className="rounded-2xl bg-[#121214] border border-white/10 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(255,255,255,0.06)] transition-all duration-300 flex flex-col cursor-pointer relative overflow-hidden group shadow-sm hover:-translate-y-1"
              >
                {/* Header Banner */}
                <div className={`h-40 bg-gradient-to-r ${visuals.banner} relative overflow-hidden flex items-start justify-end p-4`}>
                  <div className="absolute inset-0 bg-black/25" />
                  
                  <span className={`relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPlatformBadgeClasses(acc.platform)}`}>
                    <visuals.PlatformIcon className="w-3.5 h-3.5" />
                    {acc.platform}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Username Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-lg text-white tracking-tight truncate group-hover:text-white/90 transition-colors">
                            @{acc.username}
                          </h3>
                        </div>
                        {acc.platform === "Discord" && acc.hasBadges && acc.badges && acc.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                            {acc.badges.map((badge: string) => (
                              <span
                                key={badge}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#5865f2]/15 text-[#5865f2] border border-[#5865f2]/30 tracking-wide uppercase"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                        {acc.platform === "TikTok" && acc.verified && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/15 text-white border border-white/30 tracking-wide uppercase">
                              <Check className="w-2.5 h-2.5" /> Verified Profile
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: BIN & C/O stacked */}
                      <div className="text-right flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-[110px] shadow-sm">
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{t("BIN", "BIN")}</span>
                          <span className="text-white font-extrabold text-sm tracking-tight">{acc.bin}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{t("C/O", "C/O")}</span>
                          <span className="text-zinc-300 font-semibold text-xs tracking-tight">
                            {acc.co === "None" ? t("—", "—") : acc.co}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta specifications list */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{t("OG Email Status", "OG Email Status")}</span>
                        <span className="text-zinc-200 font-medium">
                          {acc.ogEmail ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> {t("Original Included", "Original Included")}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {t("Not Included", "Not Included")}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{t("Safety Condition", "Safety Condition")}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-white/80 font-semibold uppercase tracking-wider">
                          {acc.condition || "Clean"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Button at the bottom */}
                  <div className="pt-5 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccount(acc);
                      }}
                      className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {t("View Details & Buy", "View Details & Buy")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Extended Product & Account Details Modal */}
      <AnimatePresence>
        {selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAccount(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {(() => {
              const details = getAccountVisuals(selectedAccount.platform, selectedAccount.username);
              return (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  className="relative w-full max-w-2xl bg-[#0b0c10]/95 border border-white/25 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.08)] backdrop-blur-3xl z-10 my-auto"
                >
                  {/* Top Ambient Glow */}
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-white/[0.12] rounded-full blur-3xl pointer-events-none" />

                  {/* Detailed Banner */}
                  <div className={`h-48 bg-gradient-to-r ${details.banner} relative p-6 flex flex-col justify-between`}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="flex justify-between items-start relative z-10 w-full">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getPlatformBadgeClasses(selectedAccount.platform)}`}>
                        <details.PlatformIcon className="w-3.5 h-3.5" />
                        {selectedAccount.platform} {t("Account", "Account")}
                      </span>
                      <button
                        onClick={() => setSelectedAccount(null)}
                        className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-all rounded-full bg-white/10 hover:bg-white/25 border border-white/20 hover:border-white/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)] cursor-pointer active:scale-95"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="relative z-10 space-y-1.5">
                      <h2 className="text-2xl font-black text-white tracking-tight">@{selectedAccount.username}</h2>
                      {selectedAccount.platform === "Discord" && selectedAccount.hasBadges && selectedAccount.badges && selectedAccount.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {selectedAccount.badges.map((badge: string) => (
                            <span
                              key={badge}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#5865f2] text-white border border-[#5865f2]/30 tracking-wide uppercase shadow-sm"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      {selectedAccount.platform === "TikTok" && selectedAccount.verified && (
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#00f2fe] text-black border border-[#00f2fe]/30 tracking-wide uppercase shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" /> Verified Profile
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Price BIN card */}
                      <div className="bg-white/[0.10] border border-white/20 rounded-2xl p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                        <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-widest block mb-1">
                          {t("BUY IT NOW PRICE", "BUY IT NOW PRICE")}
                        </span>
                        <span className="text-white text-2xl font-black">{selectedAccount.bin}</span>
                        <span className="text-[10px] text-white/60 block mt-1">{t("Instant transfer", "Instant transfer")}</span>
                      </div>

                      {/* Current Offer card */}
                      <div className="bg-white/[0.10] border border-white/20 rounded-2xl p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                        <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-widest block mb-1">
                          {t("HIGHEST BID OFFER", "HIGHEST BID OFFER")}
                        </span>
                        <span className="text-white text-2xl font-bold">
                          {selectedAccount.co === "None" ? t("No bids", "No bids") : selectedAccount.co}
                        </span>
                        <span className="text-[10px] text-white/60 block mt-1">{t("Minimum offer +5%", "Minimum offer +5%")}</span>
                      </div>

                      {/* OG Email Status card */}
                      <div className="bg-white/[0.10] border border-white/20 rounded-2xl p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                        <span className="text-[10px] text-white/60 font-extrabold uppercase tracking-widest block mb-1">
                          {t("ORIGINAL EMAIL (OG)", "ORIGINAL EMAIL (OG)")}
                        </span>
                        <span className={`text-lg font-bold flex items-center justify-center gap-1 mt-1 ${selectedAccount.ogEmail ? "text-emerald-400" : "text-amber-400"}`}>
                          {selectedAccount.ogEmail ? (
                            <>
                              <BadgeCheck className="w-5 h-5" /> {t("Included", "Included")}
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5" /> {t("None", "None")}
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-white/60 block mt-1">
                          {selectedAccount.ogEmail ? t("Full creation access", "Full creation access") : t("Clean personal transfer", "Clean personal transfer")}
                        </span>
                      </div>
                    </div>

                    {/* Account specifications list */}
                    <div className="bg-white/[0.10] border border-white/20 rounded-2xl p-5 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                      <h4 className="font-semibold text-white text-sm tracking-wide uppercase">{t("Listing Specifications", "Listing Specifications")}</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
                        <div className="flex items-center justify-between py-1 border-b border-white/10">
                          <span className="text-white/60">{t("Creation/Age", "Creation/Age")}</span>
                          <span className="text-white font-medium">{t("Aged (Premium)", "Aged (Premium)")}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/10">
                          <span className="text-white/60">{t("Condition", "Condition")}</span>
                          <span className="text-white font-medium">{selectedAccount.condition || "Clean"}</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/10">
                          <span className="text-white/60">{t("Ownership Verified", "Ownership Verified")}</span>
                          <span className="text-white font-medium flex items-center gap-1">
                            <Check className="w-4 h-4" /> {t("100% Yes", "100% Yes")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/10">
                          <span className="text-white/60">{t("Listed On", "Listed On")}</span>
                          <span className="text-white font-medium">
                            {new Date(selectedAccount.date || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed pt-2">
                        {details.desc} {t("Our team has verified all administrative permissions, original recovery options, and connection history.", "Our team has verified all administrative permissions, original recovery options, and connection history.")}
                      </p>
                    </div>

                    {/* Interactive Action Area: Buy & Bid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error(t("Please sign up or log in to buy accounts", "Please sign up or log in to buy accounts"));
                            navigate("/auth");
                            return;
                          }
                          setIsCheckoutOpen(true);
                        }}
                        className="py-4 rounded-xl bg-white hover:bg-white/90 text-black font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(255,255,255,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Zap className="w-4 h-4 text-black fill-current" />
                        {t("Buy It Now for", "Buy It Now for")} {selectedAccount.bin}
                      </button>

                      {/* Custom offer bid form */}
                      <form onSubmit={handleBidSubmit} className="flex gap-2">
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={t("Enter Offer ($)...", "Enter Offer ($)...")}
                          className="flex-grow bg-white/10 border border-white/20 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/50 placeholder-white/40"
                        />
                        <button
                          type="submit"
                          className="px-5 rounded-xl bg-white/15 border border-white/25 hover:bg-white/25 text-white font-semibold text-sm transition-colors cursor-pointer"
                        >
                          {t("Bid", "Bid")}
                        </button>
                      </form>
                    </div>

                    {/* Buyer protection guarantee block */}
                    <div className="bg-white/[0.08] p-4 rounded-2xl border border-white/15 flex items-start gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                      <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        {t("Buyer Protection Guarantee: Funds remain in escrow until ownership is transferred and confirmed. Instant account credentials will be displayed in your client panel.", "Buyer Protection Guarantee: Funds remain in escrow until ownership is transferred and confirmed. Instant account credentials will be displayed in your client panel.")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal Integration for Direct Purchase */}
      {selectedAccount && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          isQuickBuy={true}
          items={[
            {
              id: selectedAccount.id || selectedAccount._id,
              name: `${selectedAccount.platform} Account: @${selectedAccount.username}`,
              price: getNumericPrice(selectedAccount.bin),
              warrantyLabel: "",
              warrantyPrice: 0,
            },
          ]}
          total={getNumericPrice(selectedAccount.bin)}
          userId={user?.id}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setSelectedAccount(null);
            navigate("/dashboard");
          }}
        />
      )}
    </div>
  );
}
