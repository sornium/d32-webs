import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { CreditCard, ShieldCheck, Lock, Smartphone, Zap, CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function PaymentMethods() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium mb-4">
          <CreditCard className="w-4 h-4 text-white" />
          <span>{t("Accepted Payments & Security", "Accepted Payments & Security")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-3">
          {t("Payment Methods", "Payment Methods")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto">
          {t(
            "Official payment options, security standards, and processing details for D32.Store purchases.",
            "Official payment options, security standards, and processing details for D32.Store purchases."
          )}
        </p>
      </motion.div>

      {/* Primary Payment Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-2xl bg-[#121215] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Credit & Debit Cards</h3>
              <p className="text-xs text-zinc-400">Visa, Mastercard, AMEX, UnionPay</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            All card payments are processed instantly through our <strong>Ziina API v2</strong> integration with full PCI-DSS Level 1 security. Your card details are processed directly by Ziina and never touch our servers.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium pt-2 border-t border-white/5">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Instant order delivery upon payment completion</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#121215] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Apple Pay & Google Pay</h3>
              <p className="text-xs text-zinc-400">1-Touch Express Mobile Checkout</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Enjoy seamless 1-click mobile checkout using biometrics (Face ID / Touch ID) on iOS, Android, and web browsers via integrated Ziina payment sheets.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium pt-2 border-t border-white/5">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Biometric authentication for maximum transaction safety</span>
          </div>
        </div>
      </div>

      {/* Detailed Payment Disclosures */}
      <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Ziina Gateway Security Standards</h2>
          </div>
          <p>
            D32.Store partners with Ziina, a licensed payment institution, to handle all card and wallet checkouts. This ensures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li><strong>Zero Sensitive Data Retention:</strong> D32.Store does not collect or store full credit card numbers, CVVs, or bank logins.</li>
            <li><strong>256-bit SSL Encryption:</strong> All transaction communication travels over TLS 1.3 encrypted channels.</li>
            <li><strong>Anti-Fraud Detection:</strong> Automated risk scoring and 3D-Secure (3DS) verification protect buyers from unauthorized charges.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Currency & Processing Fees</h2>
          </div>
          <p>
            Prices on D32.Store are displayed in USD ($) and local supported currencies. Standard payment processing fees are fully absorbed by D32.Store—there are no hidden transaction surcharges at checkout.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">3. Non-Refundable Digital Goods Notice</h2>
          </div>
          <p>
            All digital software keys, proxy credentials, and account purchases made through supported payment methods are strictly non-refundable once delivered. Review our full policy on our <Link to="/Terms-of-service" className="text-white underline font-medium">Terms of Service</Link> and <Link to="/safety-policies" className="text-white underline font-medium">Safety Policies</Link>.
          </p>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div className="text-white font-semibold text-sm">Have a question about a payment?</div>
          <div className="text-xs text-zinc-400">Contact our 24/7 support team or open a ticket in your account dashboard.</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/Terms-of-service"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/tickets"
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
          >
            Support Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
