import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  Building2, 
  Mail, 
  FileText,
  Copy,
  Check
} from "lucide-react";
import { useCurrency } from "../lib/currency";
import toast from "react-hot-toast";

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function OrderInvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const { formatPrice } = useCurrency();
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const displayId = order.displayId || order.orderId || (order.id ? `D32-${order.id.slice(0, 6).toUpperCase()}` : "D32-000000");
  const invoiceNumber = `INV-${displayId.replace(/^D32-/, "")}`;
  const dateFormatted = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

  const currency = (order.currency || "USD").toUpperCase();

  // Normalize order items
  const items: any[] = Array.isArray(order.cartItems) && order.cartItems.length > 0
    ? order.cartItems
    : order.items && Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          name: order.product?.name || order.productName || "Digital Asset",
          price: order.price || 0,
          quantity: order.quantity || 1,
          warranty: false,
        }
      ];

  const subtotal = items.reduce((acc, it) => {
    const p = Number(it.price || 0);
    const q = Number(it.quantity || 1);
    const w = Number(it.warrantyPrice || 0);
    return acc + (p * q) + w;
  }, 0);

  const handlingFee = Math.round(subtotal * 0.025 * 100) / 100;
  const isPaidWithWallet = order.paymentStatus === "paid_with_wallet" || order.paymentMethod?.toLowerCase().includes("wallet");
  const totalPaid = Number(order.price || (subtotal + handlingFee));

  const isCompleted = order.status === "Completed";
  const isPreparing = order.status === "Preparing";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDetails = () => {
    const text = `D32 Store Invoice #${invoiceNumber}
Date: ${dateFormatted}
Order ID: #${displayId}
Total Paid: ${currency} ${formatPrice(totalPaid)}
Status: ${order.status || "Paid"}
Payment Method: ${isPaidWithWallet ? "D32 Store Wallet Credit" : "Ziina / Online Payment"}
Customer: ${order.customerEmail || order.guestEmail || "Verified Customer"}
Item(s):
${items.map(i => `- ${i.name} (Qty: ${i.quantity || 1}) - ${currency} ${formatPrice(i.price)}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Invoice summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md print:hidden"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#0e1015] border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9),inset_0_1px_1.5px_rgba(255,255,255,0.35)] overflow-hidden my-auto text-white z-10 print:static print:max-w-none print:w-full print:bg-white print:text-black print:border-none print:shadow-none max-h-[90dvh] flex flex-col"
          >
            {/* Action Bar (Hidden when printing) */}
            <div className="p-4 sm:px-6 bg-white/[0.08] border-b border-white/10 flex items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Customer Tax & Purchase Invoice
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
                  title="Copy Invoice Summary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Print or Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div 
              ref={printRef} 
              className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 print:p-8 print:text-black print:bg-white"
            >
              {/* Header: Brand & Invoice Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/15 print:border-black/20 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-white print:text-black font-sans">
                      D32<span className="text-white/60 print:text-black/60 font-medium">.STORE</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 print:bg-emerald-100 text-emerald-400 print:text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30 print:border-emerald-300">
                      Official Receipt
                    </span>
                  </div>
                  <p className="text-xs text-white/50 print:text-gray-600 mt-1 max-w-xs">
                    Premium Digital Accounts, Gaming Keys & Security Solutions.
                  </p>
                  <p className="text-xs text-white/40 print:text-gray-500 mt-0.5">
                    support@d32.store • https://d32.store
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-lg font-mono font-bold text-white print:text-black">
                    {invoiceNumber}
                  </div>
                  <div className="text-xs text-white/60 print:text-gray-600">
                    <span className="text-white/40 print:text-gray-400">Date: </span>
                    {dateFormatted}
                  </div>
                  <div className="text-xs text-white/60 print:text-gray-600">
                    <span className="text-white/40 print:text-gray-400">Order ID: </span>
                    <span className="font-mono font-semibold">#{displayId}</span>
                  </div>
                </div>
              </div>

              {/* Bill To & Payment Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.04] print:bg-gray-50 border border-white/10 print:border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 print:text-gray-500 block mb-1">
                    Billed To
                  </span>
                  <div className="font-semibold text-white print:text-black text-sm">
                    {order.customerName || "D32 Customer"}
                  </div>
                  <div className="text-white/70 print:text-gray-700 mt-0.5">
                    {order.customerEmail || order.guestEmail || "Verified Checkout Customer"}
                  </div>
                  <div className="text-[11px] text-white/40 print:text-gray-500 mt-1">
                    Customer Account: #{order.userId || "guest"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 print:text-gray-500 block mb-1">
                    Payment & Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white print:text-black">
                      {isPaidWithWallet ? "D32 Wallet Store Credit" : "Ziina Payment Gateway / Card"}
                    </span>
                  </div>
                  <div className="text-white/70 print:text-gray-700 mt-0.5">
                    Transaction ID: <span className="font-mono">{order.transactionId || order.ziinaIntentId || displayId}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCompleted 
                        ? "bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800" 
                        : isPreparing
                        ? "bg-blue-500/20 text-blue-400 print:bg-blue-100 print:text-blue-800"
                        : "bg-amber-500/20 text-amber-400 print:bg-amber-100 print:text-amber-800"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{order.status || "Paid"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 print:border-black/20 text-white/50 print:text-gray-500 uppercase text-[10px]">
                      <th className="py-2.5 font-bold">Item Description</th>
                      <th className="py-2.5 font-bold text-center">Qty</th>
                      <th className="py-2.5 font-bold text-right">Unit Price</th>
                      <th className="py-2.5 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-200">
                    {items.map((item, idx) => {
                      const prodName = item.product?.name || item.name || "Digital Goods";
                      const qty = Number(item.quantity || 1);
                      const unitPrice = Number(item.product?.price || item.price || 0);
                      const lineTotal = unitPrice * qty;

                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                          <td className="py-3 pr-2">
                            <div className="font-semibold text-white print:text-black">
                              {prodName}
                            </div>
                            {item.warranty && (
                              <div className="text-[11px] text-emerald-400 print:text-emerald-700 flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                <span>{item.warrantyLabel || "Warranty Shield Coverage"}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center text-white/80 print:text-gray-800 font-mono">
                            {qty}
                          </td>
                          <td className="py-3 px-2 text-right text-white/80 print:text-gray-800 font-mono">
                            {formatPrice(unitPrice)}
                          </td>
                          <td className="py-3 pl-2 text-right font-bold text-white print:text-black font-mono">
                            {formatPrice(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Calculation Breakdown */}
              <div className="border-t border-white/15 print:border-black/20 pt-4 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-white/60 print:text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{currency} {formatPrice(subtotal)}</span>
                  </div>

                  {handlingFee > 0 && (
                    <div className="flex justify-between text-white/60 print:text-gray-600">
                      <span>Gateway & Handling (2.5%)</span>
                      <span className="font-mono">{currency} {formatPrice(handlingFee)}</span>
                    </div>
                  )}

                  {isPaidWithWallet && (
                    <div className="flex justify-between text-emerald-400 print:text-emerald-700 font-medium">
                      <span>Store Credit Applied</span>
                      <span className="font-mono">-{currency} {formatPrice(totalPaid)}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/15 print:bg-black/20 my-2" />

                  <div className="flex justify-between text-white print:text-black font-bold text-sm">
                    <span>Total Paid</span>
                    <span className="font-mono text-base font-extrabold text-white print:text-black">
                      {currency} {formatPrice(totalPaid)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal & Policy Note */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] print:bg-gray-100 border border-white/10 print:border-gray-200 text-[11px] text-white/50 print:text-gray-600 leading-relaxed">
                <p className="font-semibold text-white/70 print:text-gray-800 mb-0.5">
                  Digital Goods Fulfillment Notice
                </p>
                <p>
                  Store terms, refund & manual preparation policy accepted at checkout. For privacy and anti-fraud security, specific private license keys are unlocked in your account upon administrative readiness verification.
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-white/40 print:text-gray-500">
                  <span>Policy Version: 2026.1</span>
                  <span>Invoice generated securely by D32.store</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
