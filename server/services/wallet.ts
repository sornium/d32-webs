import { prisma, isDatabaseConfigured } from "../db.js";

export interface WalletInfo {
  userId: string;
  balance: number;
  updatedAt: Date;
}

export interface WalletTransactionItem {
  id: string;
  amount: number;
  type: "CREDIT_REFUND" | "CREDIT_ADMIN" | "DEBIT_PURCHASE";
  description: string;
  orderId?: string | null;
  createdAt: Date;
}

/**
 * Get or create wallet for authenticated user
 */
export async function getUserWallet(userId: string): Promise<WalletInfo | null> {
  if (!isDatabaseConfigured() || !userId || userId === "guest") {
    return null;
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId }, { id: userId }, { username: userId }],
      },
    });

    if (!user) return null;

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.userId,
          balance: 0.0,
        },
      });
    }

    return {
      userId: wallet.userId,
      balance: Math.round(wallet.balance * 100) / 100,
      updatedAt: wallet.updatedAt,
    };
  } catch (err) {
    console.error("[Wallet Service] Error getting user wallet:", err);
    return null;
  }
}

/**
 * Credit user wallet (refund as store credit or admin bonus)
 */
export async function creditUserWallet(params: {
  userId: string;
  amount: number;
  description: string;
  orderId?: string;
  type?: "CREDIT_REFUND" | "CREDIT_ADMIN";
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!isDatabaseConfigured() || !params.userId) {
    return { success: false, error: "Database not connected" };
  }

  const creditAmount = Math.round(Math.abs(Number(params.amount || 0)) * 100) / 100;
  if (creditAmount <= 0) {
    return { success: false, error: "Invalid credit amount" };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: params.userId }, { id: params.userId }, { username: params.userId }],
      },
    });

    if (!user) {
      return { success: false, error: "Target customer not found" };
    }

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { userId: user.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: user.userId,
            balance: 0.0,
          },
        });
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: creditAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.userId,
          amount: creditAmount,
          type: params.type || "CREDIT_REFUND",
          description: params.description,
          orderId: params.orderId || null,
        },
      });

      return updatedWallet;
    });

    return {
      success: true,
      newBalance: Math.round(result.balance * 100) / 100,
    };
  } catch (err: any) {
    console.error("[Wallet Service] Credit failed:", err);
    return { success: false, error: err?.message || "Failed to credit wallet" };
  }
}

/**
 * Debit user wallet for purchase
 */
export async function debitUserWallet(params: {
  userId: string;
  amount: number;
  description: string;
  orderId: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!isDatabaseConfigured() || !params.userId || params.userId === "guest") {
    return { success: false, error: "Authenticated account required for wallet payments" };
  }

  const debitAmount = Math.round(Math.abs(Number(params.amount || 0)) * 100) / 100;
  if (debitAmount <= 0) {
    return { success: false, error: "Invalid debit amount" };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId: params.userId }, { id: params.userId }, { username: params.userId }],
      },
    });

    if (!user) {
      return { success: false, error: "Customer account not found" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: user.userId },
      });

      if (!wallet || wallet.balance < debitAmount) {
        throw new Error("Insufficient wallet balance to cover this purchase.");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: debitAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.userId,
          amount: -debitAmount,
          type: "DEBIT_PURCHASE",
          description: params.description,
          orderId: params.orderId,
        },
      });

      return updatedWallet;
    });

    return {
      success: true,
      newBalance: Math.round(result.balance * 100) / 100,
    };
  } catch (err: any) {
    console.warn("[Wallet Service] Debit rejected:", err?.message);
    return { success: false, error: err?.message || "Wallet payment could not be processed" };
  }
}

/**
 * Get wallet transactions history
 */
export async function getUserWalletTransactions(userId: string): Promise<WalletTransactionItem[]> {
  if (!isDatabaseConfigured() || !userId) {
    return [];
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userId }, { id: userId }, { username: userId }],
      },
    });

    if (!user) return [];

    const txs = await prisma.walletTransaction.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return txs.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      orderId: t.orderId,
      createdAt: t.createdAt,
    }));
  } catch (err) {
    console.error("[Wallet Service] Error fetching transactions:", err);
    return [];
  }
}
