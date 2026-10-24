import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Globe,
  Check,
  Search,
} from "lucide-react";
import { useStore } from "../store";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation, SUPPORTED_LANGUAGES } from "../lib/i18n";
import { SUPPORTED_CURRENCIES, getCurrencyConfig } from "../lib/currency";
import BrandLogo from "./BrandLogo";

export default function Navigation() {
  const { user, cart, currency, setCurrency, language, setLanguage } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [mobileCurrOpen, setMobileCurrOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'language' | 'currency'>('language');
  const [currencySearch, setCurrencySearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const location = useLocation();
  const { t } = useTranslation();

  const currentLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === (language || "EN").toUpperCase()) || SUPPORTED_LANGUAGES[0];
  const currentCurrMeta = getCurrencyConfig(currency || "USD");

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const calculatedOpacity = Math.min(scrollY / 100, 1);
      setScrollOpacity(calculatedOpacity);
      setIsScrolled(scrollY > 8);
    };

    // Call once to set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.home", "Home"), path: "/" },
    { name: t("nav.store", "Store"), path: "/store" },
    { name: t("nav.proxy", "Proxy"), path: "/proxy" },
    { name: t("nav.reviews", "Reviews"), path: "/reviews" },
  ];

  const isAdminSubdomain = 
    typeof window !== "undefined" && 
    (window.location.hostname === "admin.d32.store" || 
     window.location.hostname === "adm.d32.store" || 
     window.location.hostname.startsWith("admin.") || 
     window.location.hostname.startsWith("adm."));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center md:px-3 md:pt-4">
      <header
        className={
          "pointer-events-auto w-full transition-all duration-300 md:max-w-6xl md:rounded-full " +
          (isScrolled
            ? "border-b border-white/20 md:border md:border-white/20 bg-white/[0.12] md:bg-white/[0.10] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.08)]"
            : "border-b border-white/15 md:border md:border-white/15 bg-white/[0.08] md:bg-white/[0.07] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)]")
        }
      >
        <div
          className={
            "relative flex items-center justify-between transition-all duration-300 px-4 md:px-6 md:gap-4 " +
            (isScrolled ? "h-14 md:h-12" : "h-14 md:h-14")
          }
        >
          {/* Left: Mobile Avatar & Title OR Desktop Brand Text */}
          <div className="flex items-center gap-3">
            {/* Mobile Avatar (Dashboard link) */}
            <div className="md:hidden flex items-center">
              {user ? (
                <Link to={isAdminSubdomain ? "/admin" : "/dashboard"}>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/25 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </Link>
              ) : (
                <Link to="/auth">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                    <User className="w-4 h-4 text-white/80" />
                  </div>
                </Link>
              )}
            </div>
            
            <Link to="/" className="flex items-center relative z-10 group">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90">
                d32<span className="text-white/70 font-medium">.store</span>
              </span>
            </Link>
          </div>

          {/* Center: Links (Desktop Only) */}
          <nav className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "text-sm transition-all px-3.5 py-1.5 rounded-full relative",
                    isActive
                      ? "text-white bg-white/15 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] font-semibold"
                      : "text-white/70 hover:text-white hover:bg-white/10 font-medium",
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Setting Elements + Mobile Burger Toggle */}
          <div className="flex items-center gap-2">
            {/* Desktop Setting Elements */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="relative hidden md:inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-medium transition-all hover:border-white/30 hover:bg-white/15 text-white/90 hover:text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                >
                  <span className="flex items-center gap-1">
                    <span>{currentLangMeta.code}</span>
                  </span>
                  <span className="w-px h-3 bg-white/20 mx-1"></span>
                  <span className="flex items-center gap-1">
                    <span className="text-white/60 font-mono text-[11px]">{currentCurrMeta.symbol}</span>
                    <span>{currentCurrMeta.code}</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-70 ml-0.5 transition-transform duration-300 ${showSettingsDropdown ? "rotate-180 text-white" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showSettingsDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettingsDropdown(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2.5 w-64 bg-[#0a0a0d]/95 border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.35)] overflow-hidden z-50 flex flex-col backdrop-blur-3xl p-2.5 text-white"
                    >
                      {/* Ambient Top Glow */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-white/15 rounded-full blur-2xl pointer-events-none" />

                      {/* Segmented Control */}
                      <div className="relative z-10 flex p-0.5 rounded-xl bg-white/[0.07] border border-white/15 mb-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]">
                        <button 
                          onClick={() => setActiveSettingsTab('language')}
                          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                            activeSettingsTab === 'language' 
                              ? 'bg-white/20 text-white shadow-sm font-semibold border border-white/25' 
                              : 'text-white/60 hover:text-white border border-transparent'
                          }`}
                        >
                          {t("Language", "Language")}
                        </button>
                        <button 
                          onClick={() => setActiveSettingsTab('currency')}
                          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                            activeSettingsTab === 'currency' 
                              ? 'bg-white/20 text-white shadow-sm font-semibold border border-white/25' 
                              : 'text-white/60 hover:text-white border border-transparent'
                          }`}
                        >
                          {t("Currency", "Currency")}
                        </button>
                      </div>

                      {activeSettingsTab === 'language' ? (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
                            <input
                              type="text"
                              value={languageSearch}
                              onChange={(e) => setLanguageSearch(e.target.value)}
                              placeholder={t("Search language...", "Search language...")}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto p-0.5 space-y-0.5 custom-scrollbar">
                            {SUPPORTED_LANGUAGES
                              .filter(
                                (l) =>
                                  l.code.toLowerCase().includes(languageSearch.toLowerCase()) ||
                                  l.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                                  l.nativeName.toLowerCase().includes(languageSearch.toLowerCase())
                              )
                              .map((l) => {
                                const isSelected = (language || 'EN').toUpperCase() === l.code;
                                return (
                                  <button
                                    key={l.code}
                                    onClick={() => {
                                      setLanguage(l.code);
                                      setShowSettingsDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all text-xs cursor-pointer",
                                      isSelected
                                        ? "bg-white/15 text-white font-medium"
                                        : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-white/90 font-medium">
                                        {l.nativeName}
                                      </span>
                                      <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                                        {l.code}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-white" />
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
                            <input
                              type="text"
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              placeholder={t("Search currency...", "Search currency...")}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/35 focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto p-0.5 space-y-0.5 custom-scrollbar">
                            {SUPPORTED_CURRENCIES
                              .filter(
                                (c) =>
                                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                  c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                  c.symbol.includes(currencySearch)
                              )
                              .map((c) => {
                                const isSelected = (currency || 'USD').toUpperCase() === c.code;
                                return (
                                  <button
                                    key={c.code}
                                    onClick={() => {
                                      setCurrency(c.code);
                                      setShowSettingsDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all text-xs cursor-pointer",
                                      isSelected
                                        ? "bg-white/15 text-white font-medium"
                                        : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white/90">
                                        {c.code}
                                      </span>
                                      <span className="text-[11px] text-white/40">
                                        {c.symbol} • {c.name}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <Link
                  to={isAdminSubdomain ? "/admin" : "/dashboard"}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 transition-all text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                  title="Dashboard"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 transition-all text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                  title="Sign In"
                >
                  <User className="w-4 h-4 text-white/80" />
                </Link>
              )}
            </div>

            <Link
              to="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 transition-all hover:border-white/30 hover:bg-white/15 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white text-black px-1 text-[10px] font-bold shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15 transition-all text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-[#0a0a0d]/95 border-t border-white/15 backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-1 px-4 pb-6 pt-3 max-h-[calc(100dvh-4.5rem)] overflow-y-auto custom-scrollbar">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      location.pathname === link.path
                        ? "bg-white/15 text-white border border-white/20 font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-2 space-y-1.5 border-t border-white/10 mt-1">
                  <div className="flex flex-col">
                    <button
                      onClick={() => setMobileLangOpen(!mobileLangOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="truncate pr-2">
                        {t("Language", "Language")}: <span className="text-white font-semibold">{currentLangMeta.nativeName} ({currentLangMeta.code})</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${mobileLangOpen ? "rotate-180 text-white" : "text-white/40"}`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileLangOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-1.5 px-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                            {SUPPORTED_LANGUAGES.map((l) => (
                              <button
                                key={l.code}
                                onClick={() => {
                                  setLanguage(l.code);
                                  setMobileLangOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between",
                                  (language || 'EN').toUpperCase() === l.code
                                    ? "bg-white/15 text-white font-medium"
                                    : "text-white/65 hover:text-white hover:bg-white/[0.05]",
                                )}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{l.nativeName}</span>
                                </span>
                                {(language || 'EN').toUpperCase() === l.code && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col">
                    <button
                      onClick={() => setMobileCurrOpen(!mobileCurrOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="truncate pr-2">
                        {t("Currency", "Currency")}: <span className="text-white font-semibold">{currentCurrMeta.code} ({currentCurrMeta.symbol})</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${mobileCurrOpen ? "rotate-180 text-white" : "text-white/40"}`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileCurrOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-1.5 px-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                            {SUPPORTED_CURRENCIES.map((c) => (
                              <button
                                key={c.code}
                                onClick={() => {
                                  setCurrency(c.code);
                                  setMobileCurrOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between",
                                  (currency || 'USD').toUpperCase() === c.code
                                    ? "bg-white/15 text-white font-medium"
                                    : "text-white/65 hover:text-white hover:bg-white/[0.05]",
                                )}
                              >
                                <span className="truncate flex items-center gap-1">
                                  <span>{c.code} ({c.symbol})</span>
                                </span>
                                {(currency || 'USD').toUpperCase() === c.code && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 mt-1">
                  {user ? (
                    <Link
                      to={isAdminSubdomain ? "/admin" : "/dashboard"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-white border border-white/15"
                    >
                      <User className="w-4 h-4 text-white" />
                      <span>{user.displayName || user.name || user.username || "My Account"}</span>
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-white text-black shadow-sm"
                    >
                      <User className="w-4 h-4 text-black" />
                      <span>Sign In / Register</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
