import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { useTranslation } from "../lib/i18n";
import { useCurrency } from "../lib/currency";
import { toast } from "react-hot-toast";
import {
  Trash2,
  ArrowRight,
  Shield,
  Minus,
  Plus,
  ShoppingBag,
  Lock,
  ChevronRight,
} from "lucide-react";
import CheckoutModal from "../components/CheckoutModal";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, user } = useStore();
  const { currency, formatPrice } = useCurrency();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);

  // BASE SUB TOTAL IN USD
  const baseSubtotal = cart.reduce(
    (sum, item) => sum + (item.product.price + (item.warrantyPrice || 0)) * item.quantity,
    0,
  );

  const baseHandling = baseSubtotal * 0.025;
  const baseTotal = baseSubtotal + baseHandling;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto pt-16 pb-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.08] border border-white/15 mx-auto flex items-center justify-center text-white shadow-inner backdrop-blur-2xl">
          <ShoppingBag className="w-8 h-8 text-white/80" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t("Your Cart is Empty", "Your Cart is Empty")}
          </h1>
          <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
            {t("Looks like you haven't added anything to your cart yet.", "Looks like you haven't added anything to your cart yet.")}
          </p>
        </div>
        <div>
          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-all active:scale-95"
          >
            <span>{t("Browse Store", "Browse Store")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-1 pb-24 text-slate-100 space-y-6">
      {/* Floating Breadcrumb Pill Bar (Topbar Aesthetic) */}
      <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] text-xs text-white/60">
        <div className="flex items-center gap-2 font-medium">
          <Link to="/store" className="hover:text-white transition-colors flex items-center gap-1.5">{t("Store", "Store")}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white font-bold">{t("Cart", "Cart")} ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-white/50 hover:text-white text-xs font-semibold hover:underline cursor-pointer"
        >
          {t("Empty Cart", "Empty Cart")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Warranty Notice Box */}
          <div className="p-4 rounded-3xl border border-white/15 bg-white/[0.08] flex items-start gap-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5 border border-white/20 shadow-inner">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">
                {t("D32 Warranty Protection Available", "D32 Warranty Protection Available")}
              </h3>
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                {t("You can review or change warranty coverage during payment — it's always optional.", "You can review or change warranty coverage during payment — it's always optional.")}
              </p>
            </div>
          </div>

          {/* Cart Item Cards */}
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-3xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 transition-all gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/15 overflow-hidden shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-0.5">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-white/50 font-medium">
                    {formatPrice(item.product.price)} {t("each", "each")}
                  </p>
                  {item.warranty && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-white font-semibold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 shadow-sm">
                      <Shield className="w-3 h-3 text-white" />
                      {item.warrantyLabel || "D32 Shield"} (+{formatPrice(item.warrantyPrice || 0)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-white/[0.08] border border-white/20 rounded-full px-3 py-1.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item.product.id,
                        Math.max(1, item.quantity - 1),
                      )
                    }
                    className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-white font-bold text-xs w-5 text-center font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item Subtotal */}
                <div className="font-extrabold text-base text-white whitespace-nowrap min-w-[90px] text-right">
                  {formatPrice((item.product.price + (item.warrantyPrice || 0)) * item.quantity)}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 rounded-full text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 p-6 rounded-3xl bg-white/[0.08] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl space-y-5">
            <h3 className="text-xs font-bold tracking-wider text-white/60 uppercase">
              {t("Order Summary", "Order Summary")}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>{t("Subtotal", "Subtotal")}</span>
                <span className="font-semibold text-white">
                  {formatPrice(baseSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-white/50 text-xs">
                <span>{t("Handling & Processing (2.5%)", "Handling & Processing (2.5%)")}</span>
                <span className="font-mono text-white/70">
                  {formatPrice(baseHandling)}
                </span>
              </div>

              <div className="h-px w-full bg-white/10 my-4" />

              <div className="flex justify-between text-white">
                <span className="font-bold text-base">{t("Total Due", "Total Due")}</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {formatPrice(baseTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutModalOpen(true);
              }}
              className="w-full py-4 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm transition-all shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>{t("Proceed to Checkout", "Proceed to Checkout")}</span>
            </button>

            <div className="pt-1 text-center">
              <Link
                to="/store"
                className="text-xs text-white/60 hover:text-white transition-colors underline"
              >
                ← {t("Continue Shopping", "Continue Shopping")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        items={cart.map((i: any) => ({
          id: i.product?.id || i.product?.productId,
          name: i.quantity > 1 ? `${i.quantity}x ${i.product.name}` : i.product.name,
          price: (i.product.price + (i.warrantyPrice || 0)) * i.quantity,
          quantity: i.quantity || 1,
          warranty: Boolean(i.warranty),
          warrantyLabel: i.warrantyLabel || "",
          warrantyPrice: (i.warrantyPrice || 0) * i.quantity,
        }))}
        total={baseTotal}
        userId={user?.id}
        onSuccess={() => {
          clearCart();
          navigate("/dashboard");
        }}
      />
    </div>
  );
}
