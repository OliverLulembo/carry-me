import { db } from "@/lib/db";
import type { WalletEntryRow } from "@/lib/wallet-entries";

export type PassengerWalletStats = {
  balance: number;
  totalTopups: number;
  totalSpentOnTrips: number;
  totalSharedOut: number;
  totalReceived: number;
  transactionsThisWeek: number;
  transactionCount: number;
  updatedAt: string;
};

export type PassengerWalletData = {
  walletId: string;
  stats: PassengerWalletStats;
  transactions: WalletEntryRow[];
};

export async function loadPassengerWallet(
  userId: string,
  transactionLimit = 100,
): Promise<PassengerWalletData | null> {
  const wallet = await db.wallet.findUnique({
    where: { userId },
    select: { id: true, balance: true, updatedAt: true },
  });
  if (!wallet) return null;

  const [entries, aggregates] = await Promise.all([
    db.walletEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: transactionLimit,
      select: {
        id: true,
        amount: true,
        kind: true,
        balanceAfter: true,
        reference: true,
        note: true,
        createdAt: true,
      },
    }),
    db.walletEntry.groupBy({
      by: ["kind"],
      where: { walletId: wallet.id },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const sumByKind = Object.fromEntries(
    aggregates.map((row) => [row.kind, row._sum.amount ?? 0]),
  );

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const transactionsThisWeek = await db.walletEntry.count({
    where: { walletId: wallet.id, createdAt: { gte: weekStart } },
  });

  const totalTopups = Math.max(0, sumByKind.TOPUP ?? 0);
  const totalSpentOnTrips = Math.abs(Math.min(0, sumByKind.TRIP_DEBIT ?? 0));
  const totalSharedOut = Math.abs(Math.min(0, sumByKind.SHARE_OUT ?? 0));
  const totalReceived =
    Math.max(0, sumByKind.SHARE_IN ?? 0) +
    Math.max(0, sumByKind.REFUND ?? 0) +
    Math.max(0, sumByKind.TRIP_RELEASE ?? 0);

  const transactionCount = aggregates.reduce((n, row) => n + row._count, 0);

  return {
    walletId: wallet.id,
    stats: {
      balance: wallet.balance,
      totalTopups,
      totalSpentOnTrips,
      totalSharedOut,
      totalReceived,
      transactionsThisWeek,
      transactionCount,
      updatedAt: wallet.updatedAt.toISOString(),
    },
    transactions: entries.map((e) => ({
      id: e.id,
      amount: e.amount,
      kind: e.kind,
      balanceAfter: e.balanceAfter,
      reference: e.reference,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
