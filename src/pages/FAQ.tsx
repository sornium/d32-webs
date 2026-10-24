import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronDown, MessageSquare } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: "General" | "Payments" | "Refunds & Warranty" | "Proxies & Products";
}

export default function FAQ() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: "Payments",
      question: "What payment methods are supported on D32.Store?",
      answer: (
        <span>
          We accept all major credit and debit cards (Visa, Mastercard, AMEX), Apple Pay, and Google Pay processed securely through our <strong>Ziina API v2</strong> payment gateway.
        </span>
      ),
    },
    {
      category: "Refunds & Warranty",
      question: "What is your refund policy?",
      answer: (
        <span>
          Due to the immediate delivery and un-returnable digital nature of software keys, proxies, and game accounts, <strong>ALL SALES ARE FINAL AND STRICTLY NON-REFUNDABLE</strong>. If a delivered item is invalid, it is replaced under our standard 24h guarantee or optional D32 Warranty. Read our complete <Link to="/safety-policies" className="text-white underline">No-Refund Policy</Link> for details.
        </span>
      ),
    },
    {
      category: "Refunds & Warranty",
      question: "What is the D32 Warranty option?",
      answer: (
        <span>
          D32 Warranty is an optional coverage plan (3, 5, or 12 months) selected during checkout. It guarantees free 1:1 direct item replacements if your digital code or account experiences issues during the warranty duration.
        </span>
      ),
    },
    {
      category: "General",
      question: "How fast is delivery after payment?",
      answer: (
        <span>
          Delivery is <strong>instant</strong>! Upon payment verification via Ziina, your digital key, proxy IP credentials, or account access details are instantly rendered in your <Link to="/dashboard" className="text-white underline font-medium">Dashboard</Link>.
        </span>
      ),
    },
    {
      category: "Proxies & Products",
      question: "What technology and security services are used?",
      answer: (
        <span>
          D32.Store utilizes <strong>Ziina</strong> for PCI-DSS compliant checkout, <strong>Cloudflare Turnstile</strong> for bot protection, and serverless <strong>Neon PostgreSQL</strong> for encrypted order persistence. Learn more on our <Link to="/safety-policies" className="text-white underline">Safety Policies page</Link>.
        </span>
      ),
    },
    {
      category: "General",
      question: "How can I contact customer support or report an issue?",
      answer: (
        <span>
          You can open a ticket anytime via <Link to="/tickets" className="text-white underline">Support Tickets</Link> in your dashboard, or join our official <Link to="/discord" className="text-white underline">Discord Server</Link> for 24/7 assistance.
        </span>
      ),
    },
  ];

  const categories = ["All", "General", "Payments", "Refunds & Warranty", "Proxies & Products"];

  const filteredFaqs = activeTab === "All" ? faqs : faqs.filter((f) => f.category === activeTab);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium mb-4">
          <HelpCircle className="w-4 h-4 text-white" />
          <span>{t("Frequently Asked Questions", "Frequently Asked Questions")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-white font-bold tracking-tight mb-3">
          {t("Help & Knowledge Base", "Help & Knowledge Base")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto">
          {t(
            "Find instant answers regarding Ziina payments, instant delivery, digital warranty policies, and marketplace safety.",
            "Find instant answers regarding Ziina payments, instant delivery, digital warranty policies, and marketplace safety."
          )}
        </p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveTab(cat);
              setOpenIndex(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === cat
                ? "bg-white text-black"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-white text-sm sm:text-base">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 border-t border-white/5 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Additional Help Banner */}
      <div className="mt-12 p-6 rounded-2xl bg-[#121215] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Still have questions?</div>
            <div className="text-xs text-zinc-400">Read our Community Guidelines or consult our Safety Policies.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/community-guidelines"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Community Rules
          </Link>
          <Link
            to="/safety-policies"
            className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
          >
            Safety & Stack Info
          </Link>
        </div>
      </div>
    </div>
  );
}
