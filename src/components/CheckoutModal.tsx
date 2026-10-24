import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  X, 
  Shield, 
  CreditCard, 
  Zap, 
  ArrowRight, 
  Wallet, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Check
} from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { useCurrency } from "../lib/currency";
import { useStore } from "../store";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  total: number;
  isQuickBuy?: boolean;
  onSuccess?: () => void;
  userId?: string;
}

// Clean custom checkbox matching D32 UI aesthetic
function CustomCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group select-none py-1">
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
          checked
            ? "bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.45)]"
            : "bg-white/[0.06] border-white/25 group-hover:border-white/50 group-hover:bg-white/10"
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3] text-black" />}
      </div>
      <span className="text-[11px] sm:text-xs text-white/80 leading-relaxed group-hover:text-white transition-colors">
        {children}
      </span>
    </label>
  );
}

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  total,
  isQuickBuy,
  onSuccess,
  userId,
}: CheckoutModalProps) {
  const { t } = useTranslation();
  const { currency, format } = useCurrency();
  const { user, setGuestToken } = useStore();

  // Dynamic editable items in cart
  const [currentItems, setCurrentItems] = useState<any[]>(items || []);

  useEffect(() => {
    if (Array.isArray(items)) {
      setCurrentItems(items);
    }
  }, [items, isOpen]);

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...currentItems];
    const target = updated[index];
    const unitPrice = Number(target.price || 0) / (Number(target.quantity) || 1);
    updated[index] = {
      ...target,
      quantity: newQty,
      price: unitPrice * newQty,
    };
    setCurrentItems(updated);

    const pid = target.id || target.productId;
    if (pid && useStore.getState().cart.some((c) => (c.product?.id || (c.product as any)?.productId) === pid)) {
      useStore.getState().updateQuantity(pid, newQty);
    }
  };

  const handleRemoveItem = (index: number) => {
    const target = currentItems[index];
    const pid = target?.id || target?.productId;
    const updated = currentItems.filter((_, idx) => idx !== index);
    setCurrentItems(updated);

    if (pid) {
      useStore.getState().removeFromCart(pid);
    }
    toast.success("Item removed from cart");
  };

  // Dynamically recalculated order totals
  const subtotal = currentItems.reduce((acc, it) => {
    const p = Number(it.price || 0);
    const wp = Number(it.warrantyPrice || 0);
    return acc + p + wp;
  }, 0);
  const handlingFee = Math.round(subtotal * 0.025 * 100) / 100;
  const currentTotal = subtotal > 0 ? Math.round((subtotal + handlingFee) * 100) / 100 : 0;

  const [paymentMethod, setPaymentMethod] = useState<"ziina" | "wallet">("ziina");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Guest checkout flow state
  const isGuest = !user?.id;
  const [guestStep, setGuestStep] = useState<"details" | "verify_code" | "ready">("details");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [guestAccessToken, setGuestAccessTokenState] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Policy agreements (all required by store terms)
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [agreeDigital, setAgreeDigital] = useState(false);

  const allAgreementsAccepted = agreeTerms && agreePrivacy && agreeRefund && agreeDigital;

  // Load wallet balance if authenticated
  useEffect(() => {
    if (user?.id && isOpen) {
      setIsLoadingWallet(true);
      const currentToken = useStore.getState().token;
      fetch("/api/auth/wallet", {
        headers: {
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.balance === "number") {
            setWalletBalance(data.balance);
            if (data.balance >= currentTotal && currentTotal > 0) {
              setPaymentMethod("wallet");
            }
          }
        })
        .catch(() => setWalletBalance(0))
        .finally(() => setIsLoadingWallet(false));
    }
  }, [user?.id, isOpen, currentTotal]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleClose = () => {
    setErrorMessage("");
    onClose();
  };

  // Request Resend verification code for guest checkout
  const handleSendGuestCode = async () => {
    const cleanEmail = guestEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!allAgreementsAccepted) {
      setErrorMessage("You must accept all required store policies before proceeding.");
      return;
    }

    setIsSendingCode(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type: "guest_checkout" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      toast.success("Verification code sent via Resend!");
      setGuestStep("verify_code");
      setCountdown(60);
    } catch (err: any) {
      setErrorMessage(err.message || "Email delivery failed.");
      toast.error(err.message || "Failed to send email.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify guest verification code
  const handleVerifyGuestCode = async () => {
    if (guestCode.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifyingCode(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: guestEmail.trim().toLowerCase(),
          code: guestCode.trim(),
          type: "guest_checkout",
          termsAccepted: true,
          policyVersion: "2026.1",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setGuestAccessTokenState(data.guestAccessToken);
      setGuestStep("ready");
      toast.success("Email verified! You may now complete your purchase.");
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Final checkout trigger (Wallet or Ziina)
  const handleCheckout = async () => {
    if (currentItems.length === 0) {
      setErrorMessage("Your cart is empty. Please add items to checkout.");
      return;
    }

    if (!allAgreementsAccepted) {
      setErrorMessage("You must accept all required store agreements before completing payment.");
      return;
    }

    // If guest, ensure email was verified
    if (isGuest && (!guestAccessToken || guestStep !== "ready")) {
      setErrorMessage("Please complete email verification before proceeding.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/payment/intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-guest-token": guestAccessToken || "",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({
          amount: currentTotal,
          currency,
          method: paymentMethod,
          userId: user?.id || "guest",
          customerEmail: user?.email || guestEmail.trim(),
          guestAccessToken: guestAccessToken || undefined,
          items: currentItems,
          cartItems: currentItems,
          agreeTerms: true,
          agreePrivacy: true,
          agreeRefund: true,
          agreeDigital: true,
          termsAccepted: true,
          policyVersion: "2026.1",
        }),
      });

      const data = await res.json().catch(() => ({ error: `Payment failed (${res.status})` }));

      if (!res.ok || !data.success) {
        setErrorMessage(data?.error || "Failed to initialize payment gateway.");
        setIsProcessing(false);
        return;
      }

      // If guest token received, remember it in client state
      if (data.order_id && (data.guest_token || guestAccessToken)) {
        setGuestToken(data.order_id, data.guest_token || guestAccessToken || "");
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setErrorMessage("No redirect URL returned by payment gateway.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
      setIsProcessing(false);
    }
  };

  const paymentBadges = ["Apple Pay", "Google Pay", "Visa", "Mastercard", "Direct Transfer"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-[#0b0c10]/95 border border-white/25 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.08)] backdrop-blur-3xl z-10 text-white flex flex-col max-h-[90dvh]"
          >
            {/* Ambient Top Glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-white/[0.12] rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative p-4 sm:p-5 border-b border-white/20 bg-white/[0.12] backdrop-blur-2xl flex items-center justify-between gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] shrink-0">
                  <CreditCard className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-white font-sans">
                      d32<span className="text-white/70 font-medium">.checkout</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/25 border border-white/35 text-[10px] font-bold text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]">
                      {isQuickBuy ? t("Quick Buy", "Quick Buy") : t("Secure", "Secure")}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs flex items-center gap-1.5 mt-0.5">
                    <Lock className="w-3 h-3 text-white/80" /> {t("256-bit SSL encrypted & verified", "256-bit SSL encrypted & verified")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-all rounded-full bg-white/10 hover:bg-white/25 border border-white/20 hover:border-white/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)] cursor-pointer active:scale-95 shrink-0"
                aria-label={t("Close", "Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="relative p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Items Summary with Quantity & Removal Controls */}
              <div className="bg-white/[0.10] border border-white/20 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span>{t("Selected Items", "Selected Items")} ({currentItems.length})</span>
                  <span>{currency} {format(currentTotal)}</span>
                </div>

                {currentItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-white/50 space-y-1">
                    <p>Your order currently has no items.</p>
                    <p className="text-[11px] text-white/40">Add items from the store to proceed.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {currentItems.map((item, idx) => {
                      const qty = item.quantity || 1;
                      const unitPrice = Number(item.price || 0) / qty;
                      const linePrice = unitPrice * qty;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-white font-medium">{item.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/50">
                              <span>{currency} {format(unitPrice)} ea</span>
                              {item.warranty && (
                                <span className="text-emerald-400 font-semibold">• Warranty Protected</span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls & Remove */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center rounded-full bg-white/10 border border-white/15 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, qty - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-xs text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, qty + 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <span className="font-bold text-white whitespace-nowrap ml-1 w-16 text-right">
                              {currency} {format(linePrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtotal & Handling Summary */}
                {currentItems.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-white/60">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-white/80">{currency} {format(subtotal)}</span>
                    </div>
                    {handlingFee > 0 && (
                      <div className="flex justify-between">
                        <span>Handling & Gateway Processing (2.5%)</span>
                        <span className="font-mono text-white/80">{currency} {format(handlingFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs text-white pt-1">
                      <span>Total Due</span>
                      <span className="font-mono text-sm text-white">{currency} {format(currentTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------- GUEST VERIFICATION FLOW ---------------- */}
              {isGuest && (
                <div className="p-4 rounded-3xl bg-white/[0.08] border border-white/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-white/70" />
                      <span>Guest Checkout Email Verification</span>
                    </span>
                    {guestStep === "ready" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {guestStep === "details" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-white/70 mb-1">
                          Your Email (for receipt, key delivery & order access)
                        </label>
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendGuestCode}
                        disabled={isSendingCode || !guestEmail.includes("@") || !allAgreementsAccepted}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isSendingCode ? "Sending Code via Resend..." : "Send Verification Code"}
                      </button>
                    </div>
                  )}

                  {guestStep === "verify_code" && (
                    <div className="space-y-3">
                      <p className="text-xs text-white/70">
                        Enter the 6-digit code sent to <span className="font-bold text-white">{guestEmail}</span>
                      </p>
                      <input
                        type="text"
                        maxLength={6}
                        value={guestCode}
                        onChange={(e) => setGuestCode(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="000000"
                        className="w-full h-11 text-center font-mono text-xl font-bold tracking-[8px] rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <button
                          type="button"
                          onClick={() => setGuestStep("details")}
                          className="underline hover:text-white cursor-pointer"
                        >
                          Change Email
                        </button>
                        <button
                          type="button"
                          disabled={countdown > 0}
                          onClick={handleSendGuestCode}
                          className="hover:text-white disabled:opacity-40 cursor-pointer"
                        >
                          {countdown > 0 ? `Resend (${countdown}s)` : "Resend Code"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyGuestCode}
                        disabled={isVerifyingCode || guestCode.length !== 6}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isVerifyingCode ? "Verifying..." : "Verify Code & Continue"}
                      </button>
                    </div>
                  )}

                  {guestStep === "ready" && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                      <span>Email confirmed: {guestEmail}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setGuestStep("details");
                          setGuestAccessTokenState(null);
                        }}
                        className="text-[11px] underline text-white/60 hover:text-white cursor-pointer"
                      >
                        Edit Email
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- REQUIRED STORE AGREEMENTS & LEGAL ACCEPTANCE ---------------- */}
              <div className="p-4 rounded-3xl bg-white/[0.06] border border-white/15 space-y-2.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
                  <Shield className="w-3.5 h-3.5 text-white/70" />
                  <span>Required Store Agreements & Legal Acceptance</span>
                </div>

                <div className="space-y-1 pt-1">
                  <CustomCheckbox checked={agreeTerms} onChange={setAgreeTerms}>
                    <Link to="/terms" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                      I have read and agree to the Terms of Service
                    </Link>
                  </CustomCheckbox>

                  <CustomCheckbox checked={agreePrivacy} onChange={setAgreePrivacy}>
                    <Link to="/privacy" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                      I have read and accept the Privacy Policy & Guidelines
                    </Link>
                  </CustomCheckbox>

                  <CustomCheckbox checked={agreeRefund} onChange={setAgreeRefund}>
                    <Link to="/refund" target="_blank" className="underline font-semibold text-white hover:text-white/80">
                      I agree to the Store Refund & Wallet Credit Policy
                    </Link>
                  </CustomCheckbox>

                  <CustomCheckbox checked={agreeDigital} onChange={setAgreeDigital}>
                    <span>I acknowledge the Digital Goods & Manual Order Preparation Policy (assigned upon admin readiness)</span>
                  </CustomCheckbox>
                </div>
              </div>

              {/* ---------------- PAYMENT METHOD SELECTION ---------------- */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Select Payment Method
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Ziina Gateway */}
                  <div
                    onClick={() => setPaymentMethod("ziina")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      paymentMethod === "ziina"
                        ? "bg-white/20 border-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                        : "bg-white/[0.06] border-white/15 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-white fill-white" />
                        <span className="text-xs font-bold text-white">Ziina Gateway</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        Cards & Pay
                      </span>
                    </div>
                    <span className="text-[11px] text-white/60">
                      Apple Pay, Google Pay, Visa & Mastercard
                    </span>
                  </div>

                  {/* D32 Wallet (if authenticated) */}
                  {user?.id && (
                    <div
                      onClick={() => {
                        if (walletBalance !== null && walletBalance >= total) {
                          setPaymentMethod("wallet");
                        } else {
                          toast.error(`Insufficient wallet balance ($${walletBalance || 0}).`);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        paymentMethod === "wallet"
                          ? "bg-white/20 border-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          : walletBalance !== null && walletBalance >= total
                          ? "bg-white/[0.06] border-white/15 hover:bg-white/10"
                          : "bg-white/[0.03] border-white/10 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">D32 Wallet</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          Store Credit
                        </span>
                      </div>
                      <span className="text-[11px] text-white/70">
                        Available: ${walletBalance !== null ? format(walletBalance) : "..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supported Cards strip */}
              {paymentMethod === "ziina" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {paymentBadges.map((badge) => (
                    <span
                      key={badge}
                      className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[10px] font-medium text-white/80"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="relative p-4 sm:p-5 border-t border-white/20 bg-white/[0.12] backdrop-blur-2xl">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing || (isGuest && guestStep !== "ready") || !allAgreementsAccepted || currentItems.length === 0}
                className="w-full py-4 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.35)] cursor-pointer active:scale-[0.98]"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {paymentMethod === "wallet" ? "Pay with Wallet" : "Pay via Ziina"}{" "}
                      {currency} {format(currentTotal)}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-white/60">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-white/70" />
                  Buyer Protection Guaranteed
                </span>
                <span>·</span>
                <span>Manual Admin Fulfillment</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
