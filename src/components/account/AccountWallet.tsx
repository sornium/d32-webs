import React, { useState, useEffect } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, RefreshCw, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCurrency } from "../../lib/currency";
import { useStore } from "../../store";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export interface WalletTransactionItem {
  id: string;
  amount: number;
  type: "CREDIT_REFUND" | "CREDIT_ADMIN" | "DEBIT_PURCHASE";
  description: string;
  orderId?: string | null;
  createdAt: string;
}

export default function AccountWallet() {
  const { formatPrice } = useCurrency();
  const { user } = useStore();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const currentToken = useStore.getState().token;
      const res = await fetch("/api/auth/wallet", {
        headers: {
          "x-user-id": user.id,
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      }
    } catch (err) {
      console.error("Failed to load wallet:", err);
      toast.error("Failed to fetch wallet information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/20 backdrop-blur-2xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>D32 Store Credit Balance</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {formatPrice(balance)}
          </div>
          <p className="text-xs text-white/60 max-w-md">
            Store credit and order refunds are automatically deposited here. You can apply your balance at checkout with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchWallet}
            disabled={loading}
            className="h-10 px-4 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/store"
            className="h-10 px-5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop with Credit</span>
          </Link>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Wallet Transactions
          </h3>
          <span className="text-xs text-white/50">{transactions.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/60 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-white/40" />
            <span>Loading transactions from secure database...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/[0.06] border border-white/10 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-white/40 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Transactions Yet</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Any store refunds, bonuses, or wallet purchase debits will be securely recorded here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0 || tx.type.startsWith("CREDIT");
              const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 hover:bg-white/[0.09] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <span>{dateStr}</span>
                        {tx.orderId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-white/70">Order #{tx.orderId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs sm:text-sm font-bold font-mono shrink-0 ${
                      isCredit ? "text-emerald-400" : "text-white/80"
                    }`}
                  >
                    {isCredit ? "+" : ""}{formatPrice(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
