import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Users, Shield, MessageSquare, AlertOctagon, Heart, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function CommunityGuidelines() {
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
          <Users className="w-4 h-4 text-white" />
          <span>{t("Community Standards & Rules", "Community Standards & Rules")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-3">
          {t("Community Guidelines", "Community Guidelines")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto">
          {t(
            "Guidelines ensuring a respectful, safe, and transparent environment for all gamers, buyers, developers, and sellers on D32.Store.",
            "Guidelines ensuring a respectful, safe, and transparent environment for all gamers, buyers, developers, and sellers on D32.Store."
          )}
        </p>
      </motion.div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-[#121215] border border-white/10 flex flex-col items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-white font-semibold text-sm">Mutual Respect</h3>
          <p className="text-xs text-zinc-400">
            Treat support staff, sellers, and fellow customers with courtesy and professionalism at all times.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-white/10 flex flex-col items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-white font-semibold text-sm">Safe Marketplace</h3>
          <p className="text-xs text-zinc-400">
            Zero tolerance for scams, off-platform deal-making, harassment, or malicious software distribution.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121215] border border-white/10 flex flex-col items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-white font-semibold text-sm">Authentic Reviews</h3>
          <p className="text-xs text-zinc-400">
            Ratings and reviews must be based on verified purchases. Fake or paid feedback is strictly banned.
          </p>
        </div>
      </div>

      {/* Detailed Guidelines */}
      <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Communication & Support Etiquette</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>Support Tickets:</strong> Keep ticket communications constructive. Refrain from sending repetitive ticket spam or aggressive messaging.
            </li>
            <li>
              <strong>Discord Community:</strong> Observe channel-specific rules, avoid excessive tagging of staff, and maintain civil dialogue in public chat channels.
            </li>
            <li>
              <strong>No Personal Data Exposure (Doxxing):</strong> Never share real names, email addresses, phone numbers, or payment credentials of any customer or staff member.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Prohibited Conduct & Marketplace Integrity</h2>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200">
            <strong>BAN POLICY:</strong> Violation of any of the following rules will result in immediate termination of account access and blacklisting from D32.Store.
          </div>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>
              <strong>Off-Marketplace Transactions:</strong> Soliciting buyers or sellers to trade outside of D32.Store escrow protection is strictly forbidden.
            </li>
            <li>
              <strong>Scamming & Fraud:</strong> Attempting to claim unreceived items falsely, using stolen credit cards, or submitting fake payment receipts.
            </li>
            <li>
              <strong>Malicious Content:</strong> Distributing viruses, malware, keyloggers, or unauthorized exploit scripts through store items or community channels.
            </li>
            <li>
              <strong>Impersonation:</strong> Pretending to be D32.Store administrators, support agents, or moderators.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">3. Customer Review Policy</h2>
          </div>
          <p>
            To maintain marketplace trust, reviews must adhere to the following standards:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>Reviews are restricted to verified purchasers linked to active user orders.</li>
            <li>Constructive criticism is welcome; however, profanity, racial slurs, or harassment in reviews will be removed.</li>
            <li>Commercial defamation or retaliatory negative reviews intended to extort refunds are prohibited.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">4. Enforcement & Reporting</h2>
          </div>
          <p>
            Our moderation team continuously monitors platform compliance. If you witness a violation of these guidelines:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/tickets"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold text-center transition-colors"
            >
              Submit Support Ticket
            </Link>
            <Link
              to="/terms"
              className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold text-center transition-colors"
            >
              View Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
