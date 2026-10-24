import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import CheckoutModal from "../components/CheckoutModal";
import { 
  ShoppingBag, 
  Zap, 
  Shield, 
  X, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Lock, 
  CheckCircle2,
  Share2,
  ChevronDown
} from "lucide-react";
import Reviews from "../components/Reviews";
import toast from "react-hot-toast";
import { useTranslation } from "../lib/i18n";
import { useCurrency } from "../lib/currency";
import { INITIAL_STORE_PRODUCTS } from "../data/storeProducts";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { user, addToCart } = useStore();
  const { currency, formatPrice } = useCurrency();
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`/api/catalog`)
      .then((res) => res.json())
      .then((cat) => {
        const found = cat.products?.find((p: any) => p.id === id);
        if (found) {
          setProduct(found);
          return null;
        }
        return fetch(`/api/products/${id}${window.location.search}`).then((r) => r.json());
      })
      .then((data) => {
        if (data) {
          if (id === "custom") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("name")) data.name = params.get("name");
            if (params.get("price")) data.price = parseFloat(params.get("price") || "0");
          }
          setProduct(data);
        }
      })
      .catch(() => {
        const found = INITIAL_STORE_PRODUCTS.find((p) => p.id === id);
        if (found) {
          setProduct(found);
        }
      });
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center text-white/50 space-y-3">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-sm font-medium">{t("Loading product details...", "Loading product details...")}</p>
      </div>
    );
  }

  const warrantyOptions = [
    { 
      months: null, 
      label: t("Standard Guarantee", "Standard Guarantee"), 
      description: t("Basic 24-hour verification window included with all purchases.", "Basic 24-hour verification window included with all purchases."),
      price: 0,
      badge: t("Default", "Default")
    },
    { 
      months: 3, 
      label: t("3 Months D32 Shield", "3 Months D32 Shield"), 
      description: t("Priority account replacement, 24/7 dedicated support & zero deductible.", "Priority account replacement, 24/7 dedicated support & zero deductible."),
      price: 15,
      badge: t("Popular", "Popular")
    },
    { 
      months: 5, 
      label: t("5 Months D32 Shield", "5 Months D32 Shield"), 
      description: t("Extended protection with instant replacement guarantee & VIP support queue.", "Extended protection with instant replacement guarantee & VIP support queue."),
      price: 25,
      badge: t("Recommended", "Recommended")
    },
    { 
      months: 12, 
      label: t("12 Months D32 Shield", "12 Months D32 Shield"), 
      description: t("Maximum annual protection with unlimited priority replacements & concierge.", "Maximum annual protection with unlimited priority replacements & concierge."),
      price: 45,
      badge: t("Best Value", "Best Value")
    },
  ];

  const getWarrantyPrice = () => {
    const opt = warrantyOptions.find((o) => o.months === selectedWarranty);
    return opt ? opt.price : 0;
  };

  const handleAddToCart = () => {
    addToCart(product, {
      warranty: selectedWarranty ? true : false,
      warrantyPrice: getWarrantyPrice(),
      warrantyLabel: selectedWarranty ? `${selectedWarranty} Months D32 Shield` : ""
    });
    toast.success(t("Added to cart", "Added to cart"));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success(t("Link copied to clipboard", "Link copied to clipboard"));
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const baseSubtotal = product.price + getWarrantyPrice();
  const baseHandling = baseSubtotal * 0.025;
  const baseTotal = baseSubtotal + baseHandling;

  const activeWarrantyObj = warrantyOptions.find((o) => o.months === selectedWarranty) || warrantyOptions[0];

  return (
    <div className="max-w-6xl mx-auto pt-1 pb-24 text-slate-100 space-y-6">
      {/* Floating Breadcrumb & Action Pill Bar (Topbar Aesthetic) */}
      <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] text-xs text-white/60">
        <div className="flex items-center gap-2 truncate">
          <Link to="/store" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0 font-medium">
            <span>{t("Store", "Store")}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <span className="text-white/70 shrink-0 font-medium">{product.brand || "Digital"}</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <span className="text-white truncate font-bold">{product.name}</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-all text-xs font-semibold cursor-pointer shrink-0 active:scale-95 shadow-inner"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? t("Copied", "Copied") : t("Share", "Share")}</span>
        </button>
      </div>

      {/* Main Product Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Product Showcase Visual (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full bg-white/[0.08] rounded-3xl border border-white/15 flex items-center justify-center p-6 sm:p-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl group">
            {/* Top-Left Brand Tag */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white tracking-wider uppercase shadow-sm">
              {product.brand || product.tag || "DIGITAL"}
            </div>

            {/* Top-Right Badge */}
            {product.badge && (
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/35 backdrop-blur-md text-[11px] font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                {product.badge}
              </div>
            )}

            {/* Product Image */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl opacity-95 transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Quick Perks Pill Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/15 text-center flex flex-col items-center justify-center gap-1 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-[11px] font-bold text-white">Instant Delivery</span>
              <span className="text-[9px] text-white/50">Automated</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/15 text-center flex flex-col items-center justify-center gap-1 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-[11px] font-bold text-white">100% Authentic</span>
              <span className="text-[9px] text-white/50">Verified Stock</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/15 text-center flex flex-col items-center justify-center gap-1 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
              <Lock className="w-4 h-4 text-white" />
              <span className="text-[11px] font-bold text-white">SSL Encrypted</span>
              <span className="text-[9px] text-white/50">Secure Checkout</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Purchasing Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-start space-y-5">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                {product.subCategory || "Verified Digital Product"}
              </span>
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {product.stock === -1 ? "Instant Delivery" : `${product.stock ?? 10}+ in stock`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-white/70 text-sm sm:text-base mt-2.5 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-4.5 rounded-3xl bg-white/[0.08] border border-white/15 backdrop-blur-2xl flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)]">
            <div>
              <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                {t("Total Price", "Total Price")}
              </div>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatPrice(product.price + getWarrantyPrice())}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-white/40 line-through">
                    {formatPrice(product.originalPrice + getWarrantyPrice())}
                  </span>
                )}
              </div>
            </div>

            {selectedWarranty && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-bold text-white shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>+{formatPrice(getWarrantyPrice())} Warranty</span>
              </div>
            )}
          </div>

          {/* Specific Product Warranty Info (configured by admin) */}
          {product.warrantyInfo && (
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm backdrop-blur-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-white block text-sm">Official Warranty Protection Included</span>
                <span className="text-emerald-300/90 font-medium">{product.warrantyInfo}</span>
              </div>
            </div>
          )}

          {/* D32 Warranty Integration Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-white/80" />
                {t("Warranty & Replacement Protection", "Warranty & Replacement Protection")}
              </span>
              <button
                type="button"
                onClick={() => setIsWarrantyOpen(true)}
                className="text-xs text-white/80 hover:text-white font-medium underline cursor-pointer"
              >
                {t("Compare options", "Compare options")}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsWarrantyOpen(true)}
              className="w-full p-4 rounded-3xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 hover:border-white/35 transition-all text-left group flex items-center justify-between gap-4 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl active:scale-[0.99]"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeWarrantyObj.label}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white border border-white/25">
                      {activeWarrantyObj.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 truncate max-w-md">
                    {activeWarrantyObj.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-white">
                  {activeWarrantyObj.price === 0 ? t("Included", "Included") : `+${formatPrice(activeWarrantyObj.price)}`}
                </span>
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>

          {/* Action Buttons: Quick Buy + Add to Cart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsQuickBuyOpen(true);
              }}
              className="h-12 px-6 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.35)] cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{t("Quick buy", "Quick buy")}</span>
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              className="h-12 px-6 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)] active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>{t("Add to cart", "Add to cart")}</span>
            </button>
          </div>

          {/* Product Specifications & Details Card */}
          {product.details && (
            <div className="p-5 rounded-3xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white/70 leading-relaxed backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t("Product Specifications", "Product Specifications")}
              </div>
              <p>{product.details}</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-14 border-t border-white/10 pt-10">
        <Reviews productId={product.id || product.productId || id} />
      </div>

      {/* ========================================================================= */}
      {/* Redesigned D32 Warranty Selection Modal (Frosted Glass Acrylic Look)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isWarrantyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-xl bg-[#0b0c10]/95 border border-white/25 rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1px_rgba(255,255,255,0.08)] backdrop-blur-3xl relative overflow-hidden max-h-[90dvh] overflow-y-auto custom-scrollbar"
            >
              {/* Top Ambient Glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-white/[0.12] rounded-full blur-3xl pointer-events-none" />

              {/* Top Close Button */}
              <button
                type="button"
                onClick={() => setIsWarrantyOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-all rounded-full bg-white/10 hover:bg-white/25 border border-white/20 hover:border-white/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)] cursor-pointer active:scale-95 z-10"
                aria-label={t("Close", "Close")}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 mb-2 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{t("D32 Warranty Protection", "D32 Warranty Protection")}</h2>
                  <p className="text-xs text-white/60">{t("Select an optional warranty plan. Change or remove anytime.", "Select an optional warranty plan. Change or remove anytime.")}</p>
                </div>
              </div>

              {/* Plan Cards List */}
              <div className="space-y-2.5 mt-6 relative z-10">
                {warrantyOptions.map((opt, idx) => {
                  const isSelected = selectedWarranty === opt.months;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedWarranty(opt.months);
                        setTimeout(() => setIsWarrantyOpen(false), 220);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer group ${
                        isSelected
                          ? "border-white/40 bg-white/25 text-white shadow-[0_0_25px_rgba(255,255,255,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.45)]"
                          : "border-white/20 hover:border-white/35 bg-white/[0.10] hover:bg-white/[0.16] text-white/90 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 pr-2">
                        {/* Radio Check Circle */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? "border-2 border-white bg-white text-black shadow-sm"
                              : "border border-white/30 group-hover:border-white/50 bg-white/10"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </div>

                        {/* Plan Details */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{opt.label}</span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border transition-colors ${
                                isSelected
                                  ? "bg-white/30 border-white/40 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]"
                                  : "bg-white/15 border-white/25 text-white/80"
                              }`}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      {/* Plan Price */}
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-extrabold text-white">
                          {opt.price === 0 ? t("Included", "Included") : `+${formatPrice(opt.price)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Note */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                <span>{t("No claims deductibles. Full instant replacement coverage.", "No claims deductibles. Full instant replacement coverage.")}</span>
                <button
                  type="button"
                  onClick={() => setIsWarrantyOpen(false)}
                  className="text-white hover:underline font-semibold cursor-pointer"
                >
                  {t("Done", "Done")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isQuickBuyOpen}
        onClose={() => setIsQuickBuyOpen(false)}
        isQuickBuy={true}
        items={[
          {
            id: product.id || product.productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            warranty: Boolean(activeWarrantyObj.months),
            warrantyLabel: activeWarrantyObj.months ? activeWarrantyObj.label : "",
            warrantyPrice: getWarrantyPrice(),
          },
        ]}
        total={baseTotal}
        userId={user?.id}
        onSuccess={() => {
          window.location.href = "/dashboard";
        }}
      />
    </div>
  );
}
