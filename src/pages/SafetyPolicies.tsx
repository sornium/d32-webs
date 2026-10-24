import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cpu, CreditCard, Lock, Server, AlertCircle, Ban, RefreshCw, KeyRound, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function SafetyPolicies() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium mb-4">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>{t("Security Disclosures & Refund Policies", "Security Disclosures & Refund Policies")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-3">
          {t("Safety Policies & Technology Stack", "Safety Policies & Technology Stack")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
          {t(
            "Transparency regarding our security infrastructure, third-party services used, strict digital item no-refund policies, and user data safeguards.",
            "Transparency regarding our security infrastructure, third-party services used, strict digital item no-refund policies, and user data safeguards."
          )}
        </p>
      </motion.div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-2xl bg-[#121215] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Infrastructure Transparency</h3>
              <p className="text-xs text-zinc-400">What software, services & payment APIs we use</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            We use industry-standard enterprise stack components, including Ziina API v2 payment gateways, Cloudflare Turnstile bot deterrence, and serverless Neon PostgreSQL.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121215] border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Strict No-Refund Policy</h3>
              <p className="text-xs text-zinc-400">All digital goods sales are non-refundable</p>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Due to the immediate delivery and un-returnable nature of software keys, proxies, and digital codes, no monetary refunds are issued once delivered.
          </p>
        </div>
      </div>

      {/* Main Policy Content */}
      <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
        {/* Section 1: What We Use (Tech Stack Disclosures) */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white">
              <Server className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Security Infrastructure & Third-Party Services (&quot;What We Use&quot;)</h2>
          </div>
          <p>
            To keep customer transactions safe, reliable, and instantaneous, D32.Store operates using the following verified integrations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <CreditCard className="w-4 h-4 text-white" />
                <span>Ziina API v2 Payment Gateway</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All debit, credit card, Apple Pay, and Google Pay transactions are processed offsite through Ziina. D32.Store never sees, touches, or stores your raw credit card numbers.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Lock className="w-4 h-4 text-white" />
                <span>Cloudflare & Turnstile Security</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We use Cloudflare Turnstile verification and DDoS protection to prevent automated bot attacks, account credential stuffing, and unauthorized checkout abuse.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <KeyRound className="w-4 h-4 text-white" />
                <span>Encrypted Neon PostgreSQL Database</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                User passwords are securely hashed using bcrypt/Argon2. Order data, proxy credentials, and digital license keys are stored in encrypted tables.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>High-Speed Proxy Protocol Pool</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Proxy Nodes provided on the marketplace use HTTP/SOCKS5 protocols with isolated session routing and 99.9% uptime monitoring.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: No Refunds & Warranty Details */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Ban className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Complete No-Refund & Return Disclosure (&quot;No Refunds&quot;)</h2>
          </div>

          <p>
            When purchasing from D32.Store, you acknowledge that you are acquiring non-physical, digital software items, license codes, game currencies, or proxies that are consumed upon delivery.
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200">
              <strong>Rule:</strong> No monetary cash refunds will be provided for any of the following reasons:
              <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-300">
                <li>Deciding you no longer need or want the item after delivery.</li>
                <li>Purchasing the wrong item or wrong region license code.</li>
                <li>Inability to operate or configure the digital tool on your device.</li>
                <li>Game account restrictions or bans issued by third-party game publishers.</li>
              </ul>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300 space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-white" />
                <span>How Defective Products Are Handled (D32 Warranty)</span>
              </div>
              <p className="text-zinc-400">
                If a key or proxy delivered to you is non-working upon delivery, you are protected by our standard 24-hour guarantee or optional extended D32 Warranty (3, 5, or 12 months). Upon verification via support ticket, a <strong>direct replacement code or replacement account</strong> will be issued.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: User Safety & Account Protection */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">3. User Safety & Best Practices</h2>
          </div>
          <p>
            Follow these essential safety practices when receiving digital credentials or proxy access on D32.Store:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>Change Default Credentials:</strong> Immediately update passwords and recovery emails for any game accounts or digital access granted.
            </li>
            <li>
              <strong>Secure Your D32 Account:</strong> Use a strong unique password and do not share your login tokens.
            </li>
            <li>
              <strong>Proxy IP Whitelisting:</strong> Always configure authorized IP lists or user:pass credentials for proxies inside your browser or software tool.
            </li>
          </ul>
        </section>

        {/* Section 4: Chargeback Logging */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">4. Transaction Verification & Anti-Fraud Logging</h2>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            All checkouts generate an immutable transaction log comprising Ziina intent IDs, Cloudflare Ray IDs, delivery timestamps, user email, and IP coordinates. Attempting fraudulent payment chargebacks will result in automatic legal and blacklist reporting across payment safety networks.
          </p>
        </section>
      </div>

      {/* Footer Navigation CTA */}
      <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div className="text-white font-semibold text-sm">Need assistance with an order?</div>
          <div className="text-xs text-zinc-400">Open a ticket or review our complete Terms of Service.</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/terms"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to="/tickets"
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
          >
            Open Support Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}
