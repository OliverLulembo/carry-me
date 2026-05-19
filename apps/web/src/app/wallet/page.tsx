import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet as WalletIcon } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCredits, formatZmw, timeAgo } from "@/lib/format";
import { loadPassengerWallet } from "@/lib/passenger-wallet";
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader";
import { TransactionList } from "@/components/wallet/TransactionList";
import { WalletActions } from "./components/WalletActions";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSession();
  if (!session) redirect("/login/passenger?redirect=%2Fwallet");

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, phone: true, role: true },
  });
  if (!user) redirect("/login/passenger?redirect=%2Fwallet");
  if (user.role === "DRIVER") redirect("/driver/dashboard");
  if (user.role === "ADMIN") redirect("/admin");

  const walletData = await loadPassengerWallet(session.sub);
  if (!walletData) redirect("/login/passenger?redirect=%2Fwallet");

  const { stats, transactions } = walletData;

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader
        user={{ fullName: user.fullName, phone: user.phone }}
        activeNav="wallet"
      />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-deep tracking-tight">Your wallet</h1>
          <p className="text-sm text-ink-500 mt-1">
            Balance, top-ups, trip fares, and every credit movement in one place.
          </p>
        </div>

        <div className="card p-6 sm:p-8 mb-6 relative overflow-hidden shadow-pop">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-ink-500">
              <WalletIcon className="w-4 h-4" size={16} />
              <p className="text-xs uppercase tracking-wider font-semibold">Available balance</p>
            </div>
            <p className="mt-2 text-4xl sm:text-5xl font-bold text-brand-deep tabular-nums">
              {formatZmw(stats.balance)}
            </p>
            <p className="text-sm text-ink-500 mt-1">{formatCredits(stats.balance)}</p>
            <p className="text-[11px] text-ink-300 mt-3">
              Last updated {timeAgo(stats.updatedAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total top-ups" value={formatZmw(stats.totalTopups)} />
          <StatCard label="Spent on trips" value={formatZmw(stats.totalSpentOnTrips)} />
          <StatCard label="Shared out" value={formatZmw(stats.totalSharedOut)} />
          <StatCard label="Received" value={formatZmw(stats.totalReceived)} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="All transactions" value={String(stats.transactionCount)} />
          <StatCard label="This week" value={String(stats.transactionsThisWeek)} />
        </div>

        <div className="mb-6">
          <WalletActions balance={stats.balance} />
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-deep">All transactions</h2>
            <span className="text-xs text-ink-500 tabular-nums">
              {transactions.length}
              {transactions.length >= 100 ? "+" : ""} shown
            </span>
          </div>
          <TransactionList entries={transactions} showFullDate />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3 sm:px-4">
      <p className="text-base sm:text-lg font-bold text-brand-deep tabular-nums">{value}</p>
      <p className="text-[10px] sm:text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}
