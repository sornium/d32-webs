import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldAlert, FileText, Ban, RefreshCw, Lock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function TermsOfService() {
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
          <FileText className="w-4 h-4 text-white" />
          <span>{t("Legal & Compliance Agreement", "Legal & Compliance Agreement")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-3">
          {t("Terms of Service", "Terms of Service")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto">
          {t(
            "Please read these terms carefully before accessing or purchasing digital goods, proxies, subscriptions, or services from D32.Store.",
            "Please read these terms carefully before accessing or purchasing digital goods, proxies, subscriptions, or services from D32.Store."
          )}
        </p>
        <div className="mt-4 text-xs text-zinc-500">
          {t("Last Updated: August 2026", "Last Updated: August 2026")}
        </div>
      </motion.div>

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10 pb-6 border-b border-white/10">
        <a
          href="#acceptance"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-colors"
        >
          1. Acceptance of Terms
        </a>
        <a
          href="#no-refunds"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-colors"
        >
          2. No Refunds Policy
        </a>
        <a
          href="#warranty"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-colors"
        >
          3. D32 Warranty
        </a>
        <a
          href="#chargebacks"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-colors"
        >
          4. Anti-Fraud & Chargebacks
        </a>
        <a
          href="#liability"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-colors"
        >
          5. Liability & Disclaimers
        </a>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-zinc-300 leading-relaxed text-sm">
        {/* Section 1 */}
        <section id="acceptance" className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          </div>
          <p>
            By accessing, creating an account on, or completing a transaction at <strong>D32.Store</strong> (&quot;the Website&quot;, &quot;the Marketplace&quot;, &quot;We&quot;, &quot;Us&quot;), you explicitly agree to be bound by these Terms of Service, along with our <Link to="/community-guidelines" className="text-white underline">Community Guidelines</Link> and <Link to="/safety-policies" className="text-white underline">Safety Policies</Link>.
          </p>
          <p>
            If you do not agree to all terms, you must immediately cease accessing the platform and refrain from placing any orders.
          </p>
        </section>

        {/* Section 2: Strict No Refunds Policy */}
        <section id="no-refunds" className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Ban className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Strict No-Refund Policy (&quot;All Sales Final&quot;)</h2>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200 font-medium">
            <strong>NOTICE:</strong> Due to the instant delivery and digital nature of our goods (digital software keys, proxies, in-game currency, game accounts, and subscription codes), ALL SALES ARE FINAL AND STRICTLY NON-REFUNDABLE ONCE DELIVERED.
          </div>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>Digital Intangibility:</strong> Digital products delivered via license keys, API credentials, or digital account credentials cannot be returned or rendered un-seen once dispatched.
            </li>
            <li>
              <strong>No Exceptions for Buyer Preference:</strong> Returns, refunds, or exchanges will NOT be granted due to change of mind, user hardware incompatibility, failure to read product specifications, or lack of skill.
            </li>
            <li>
              <strong>Third-Party Platform Changes:</strong> We are not responsible if a third-party gaming title, publisher, server host, or application updates its terms, patches its software, or bans an account after delivery.
            </li>
            <li>
              <strong>Defective Delivery Remedy:</strong> If a delivered digital code or key is verifiably invalid at the exact moment of delivery, your sole remedy is replacement via an active warranty claim (see Section 3).
            </li>
          </ul>
        </section>

        {/* Section 3: D32 Warranty */}
        <section id="warranty" className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">3. D32 Warranty & Replacement Guarantee</h2>
          </div>
          <p>
            To provide customer peace of mind, D32.Store offers optional extended warranty protection (3, 5, or 12 months) selectable during checkout:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="font-bold text-white text-sm mb-1">Standard Guarantee</div>
              <div className="text-xs text-zinc-400">Covered for 24 hours against initial key/credential invalidity upon delivery.</div>
            </div>
            <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
              <div className="font-bold text-white text-sm mb-1">D32 Extended Warranty</div>
              <div className="text-xs text-zinc-300">Provides direct automated replacements for defective codes/accounts throughout the purchased coverage term.</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="font-bold text-white text-sm mb-1">Replacement Only</div>
              <div className="text-xs text-zinc-400">Warranty coverage provides direct 1:1 item replacements, never monetary cash refunds.</div>
            </div>
          </div>
        </section>

        {/* Section 4: Chargebacks & Anti-Fraud */}
        <section id="chargebacks" className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">4. Chargeback Prevention & Anti-Fraud Enforcement</h2>
          </div>
          <p>
            Any unauthorized transaction dispute, friendly-fraud, or payment chargeback initiated through your bank or payment provider (such as Ziina, credit card issuer, or bank) constitutes a breach of contract:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>Immediate Blacklisting:</strong> Filing a chargeback results in the instant permanent termination of your D32.Store account, IP address block, and revocation of all active licenses.
            </li>
            <li>
              <strong>Evidence Submission:</strong> All transactions are recorded with Cloudflare Turnstile verification logs, IP geolocation, device fingerprints, Ziina transaction IDs, and delivery audit logs, which are submitted to fraud investigation agencies and payment dispute networks.
            </li>
            <li>
              <strong>Dispute Resolution:</strong> If you experience any issue with your order, you must contact our support team via <Link to="/tickets" className="text-white underline">Support Tickets</Link> or Discord prior to contacting payment providers.
            </li>
          </ul>
        </section>

        {/* Section 5: Liability & Disclaimers */}
        <section id="liability" className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Lock className="w-4 h-4 text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-white">5. Limitation of Liability & Third-Party Disclaimers</h2>
          </div>
          <p>
            D32.Store acts as a digital marketplace. We do not own third-party software, game titles, or platforms mentioned on our site. All trademarks, game logos, and brand names belong to their respective copyright holders.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            THE SERVICES AND PRODUCTS ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. D32.STORE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR SPECIAL DAMAGES ARISING FROM THE USE OF PRODUCTS OR SERVICES BOUGHT ON THE MARKETPLACE.
          </p>
        </section>
      </div>

      {/* Footer Navigation CTA */}
      <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div className="text-white font-semibold text-sm">Have questions about our terms?</div>
          <div className="text-xs text-zinc-400">Our support team is available 24/7 on Discord or via support tickets.</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/safety-policies"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Safety Policies
          </Link>
          <Link
            to="/community-guidelines"
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
          >
            Community Guidelines
          </Link>
        </div>
      </div>
    </div>
  );
}
