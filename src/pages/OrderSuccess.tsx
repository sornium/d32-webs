import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Shield,
  ShoppingBag,
  Key,
  Copy,
  Check,
  AlertCircle,
  LifeBuoy,
  ArrowRight,
  FileText
} from "lucide-react";
import OrderInvoiceModal from "../components/OrderInvoiceModal";
import { useTranslation } from "../lib/i18n";
import { useStore } from "../store";
import toast from "react-hot-toast";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "preparing" | "completed" | "simulated_pending" | "pending" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isConfirmingSimulated, setIsConfirmingSimulated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<boolean>(false);

  const { clearCart, user, guestTokens } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  const intentId =
    searchParams.get("payment_intent") ||
    searchParams.get("intent_id") ||
    searchParams.get("id") ||
    searchParams.get("payment_intent_id");
  const lookupId = orderId || intentId;
  const guestTokenParam = searchParams.get("guest_token") || (lookupId ? guestTokens[lookupId] : "");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Key copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const verifyPayment = async (confirmSim = false) => {
    if (!lookupId) {
      clearCart();
      setStatus("preparing");
      return;
    }

    if (confirmSim) {
      setIsConfirmingSimulated(true);
    } else {
      setIsVerifying(true);
    }

    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-guest-token": guestTokenParam || "",
        },
        body: JSON.stringify({
          orderId,
          intentId,
          guestToken: guestTokenParam,
          confirmSimulated: confirmSim,
          userId: user?.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        clearCart();
        const ord = data.order || null;
        setOrderData(ord);

        if (ord?.status === "Completed") {
          setStatus("completed");
        } else {
          // Normal production flow: payment verified -> order is PREPARING
          setStatus("preparing");
        }

        if (confirmSim) {
          toast.success("Payment authorized successfully!");
        }
      } else if (data.simulated) {
        setOrderData(data.order || null);
        setStatus("simulated_pending");
      } else {
        setOrderData(data.order || null);
        setStatus("pending");
        setErrorMessage(data.message || data.error || "Payment is pending verification.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Unable to connect to payment server.");
    } finally {
      setIsConfirmingSimulated(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyPayment(false);
  }, [lookupId]);

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-24 px-4 text-center space-y-6">
      {/* Floating Status Pill Header */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] text-xs text-white/70 font-semibold">
        <Shield className="w-3.5 h-3.5 text-white" />
        <span>d32.store Official Order</span>
        {orderData?.displayId && (
          <>
            <span className="text-white/30">·</span>
            <span className="font-mono text-white font-bold">{orderData.displayId}</span>
          </>
        )}
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.08] border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verifying payment status...
          </h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Checking payment provider confirmation and order authorization...
          </p>
        </div>
      )}

      {/* Sandbox Test Prompt (when running with sandbox credentials) */}
      {status === "simulated_pending" && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.08] border border-white/20 shadow-2xl backdrop-blur-2xl text-left space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Clock className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Payment Authorization Test Mode</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  Sandbox
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">Click below to simulate real payment authorization</p>
            </div>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            Your transaction was initialized in test mode. Authorizing this payment will mark your order as{" "}
            <strong className="text-white">Preparing</strong> so the staff can assign your purchased keys.
          </p>

          <button
            type="button"
            disabled={isConfirmingSimulated}
            onClick={() => verifyPayment(true)}
            className="w-full py-4 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            {isConfirmingSimulated ? "Authorizing..." : "Authorize Test Payment"}
          </button>
        </div>
      )}

      {/* PRODUCTION STATUS: PREPARING (Payment verified, keys being assigned by Admin) */}
      {status === "preparing" && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.08] border border-white/20 shadow-2xl backdrop-blur-2xl space-y-6 text-left">
          {/* Top Banner */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Clock className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Payment Verified · Order Preparing
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                  Preparing
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/70">
                Order <span className="font-mono font-bold text-white">#{orderData?.displayId || orderId}</span> has been confirmed.
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white/70">
              <span>Order Progress</span>
              <span className="text-blue-400">Step 2 of 3</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex flex-col items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Paid</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold flex flex-col items-center gap-1">
                <Clock className="w-4 h-4 animate-spin" />
                <span>2. Preparing</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 font-medium flex flex-col items-center gap-1">
                <Key className="w-4 h-4" />
                <span>3. Ready</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs sm:text-sm text-white/80 leading-relaxed">
            <p>
              Your payment has been successfully authorized and securely recorded on our backend.
            </p>
            <p className="text-white/60 text-xs">
              An authorized administrator is currently preparing your digital goods and assigning your specific credentials. For your privacy and security, private product keys are not exposed until the admin marks the order ready.
            </p>
            <p className="text-white/60 text-xs">
              You will receive an email notification via Resend once ready, and you can also track this order anytime from your Orders dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>View & Download Invoice</span>
            </button>

            <Link
              to="/dashboard/orders"
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View in My Orders</span>
            </Link>

            <Link
              to={`/dashboard/tickets?orderId=${encodeURIComponent(orderData?.orderId || orderId || "")}`}
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      )}

      {/* PRODUCTION STATUS: COMPLETED (Admin has assigned keys!) */}
      {status === "completed" && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.08] border border-white/20 shadow-2xl backdrop-blur-2xl space-y-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order Completed</h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/70">
                Your purchased item and license keys are unlocked below.
              </p>
            </div>
          </div>

          {/* Secure Keys Vault */}
          {orderData?.assignedItemKey ? (
            <div className="p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Assigned Product Key / Credentials</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  Confidential
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 font-mono text-sm text-white flex items-center justify-between gap-3 select-all">
                <span className="break-all">{orderData.assignedItemKey}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(orderData.assignedItemKey, "assigned-key")}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedKey === "assigned-key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>

              {orderData.assignedItemNotes && (
                <div className="pt-2 text-xs text-white/70">
                  <span className="font-semibold text-white">Instructions: </span>
                  <span>{orderData.assignedItemNotes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white/70">
              Delivery finalized. Keys are securely stored in your account orders vault.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>View & Download Invoice</span>
            </button>

            <Link
              to="/dashboard/orders"
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Go to My Orders</span>
            </Link>

            <Link
              to="/store"
              className="w-full sm:flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="p-8 rounded-3xl bg-white/[0.08] border border-rose-500/30 space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Payment Unconfirmed</h2>
          <p className="text-xs sm:text-sm text-white/70">{errorMessage}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => verifyPayment(false)}
              className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs cursor-pointer"
            >
              Retry Verification
            </button>
            <Link
              to="/cart"
              className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs"
            >
              Return to Cart
            </Link>
          </div>
        </div>
      )}

      {/* Order Invoice Modal */}
      {orderData && (
        <OrderInvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          order={orderData}
        />
      )}
    </div>
  );
}
