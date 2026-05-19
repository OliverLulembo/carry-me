import { Banknote, Bus, TrendingUp } from "lucide-react";
import { formatCredits, formatZmw } from "@/lib/format";

export function OwnerBalanceCard({
  balance,
  todayCredits,
  totalBuses,
  activeBuses,
}: {
  balance: number;
  todayCredits: number;
  totalBuses: number;
  activeBuses: number;
}) {
  return (
    <div className="card p-6 h-full flex flex-col text-ink-700 relative overflow-hidden shadow-pop">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-brand-secondary/20 blur-2xl pointer-events-none" />
      <div className="relative">
        <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5" size={14} />
          Available to withdraw
        </p>
        <MotionBalanceCardAmount balance={balance} />
        <p className="text-xs text-ink-500 mt-1">{formatCredits(balance)} in your wallet</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle text-ink-700">
            <TrendingUp className="w-3 h-3 text-success" size={12} />
            +{formatCredits(todayCredits)} today
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle text-ink-700">
            <Bus className="w-3 h-3 text-brand-primary" size={12} />
            {totalBuses} {totalBuses === 1 ? "bus" : "buses"}
            {activeBuses > 0 ? ` · ${activeBuses} on route` : ""}
          </span>
        </div>

        <p className="text-[11px] text-ink-500 mt-6 pt-4 border-t border-ink-100">
          1 credit = 1 ZMW. Earnings credit when passengers tap off on your buses.
        </p>
      </div>
    </div>
  );
}

function MotionBalanceCardAmount({ balance }: { balance: number }) {
  return (
    <div className="mt-1 flex items-baseline gap-2">
      <span className="text-4xl font-bold text-brand-deep">{formatZmw(balance)}</span>
    </div>
  );
}
