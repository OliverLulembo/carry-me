import { ArrowDown, ArrowUp, Bus, Send, RefreshCw, Wallet } from "lucide-react";
import { formatZmw, timeAgo } from "@/lib/format";

type Entry = {
  id: string;
  amount: number;
  kind: string;
  note: string | null;
  createdAt: string;
  balanceAfter: number;
};

const KIND_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; tone: "in" | "out" | "neutral" }
> = {
  TOPUP: { label: "Top-up", icon: ArrowDown, tone: "in" },
  TRIP_DEBIT: { label: "Trip", icon: Bus, tone: "out" },
  TRIP_HOLD: { label: "Held for trip", icon: Wallet, tone: "neutral" },
  TRIP_RELEASE: { label: "Released", icon: RefreshCw, tone: "in" },
  SHARE_OUT: { label: "Shared out", icon: Send, tone: "out" },
  SHARE_IN: { label: "Received", icon: ArrowDown, tone: "in" },
  REFUND: { label: "Refund", icon: ArrowDown, tone: "in" },
  ADJUSTMENT: { label: "Adjustment", icon: RefreshCw, tone: "neutral" },
  WITHDRAWAL_OUT: { label: "Withdrawal", icon: ArrowUp, tone: "out" },
};

export function RecentActivity({ entries }: { entries: Entry[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-deep">Recent activity</h3>
        <a className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600">
          See all →
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-8">
          No transactions yet. Top up to get started.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {entries.map((e) => {
            const meta = KIND_META[e.kind] ?? {
              label: e.kind,
              icon: Wallet,
              tone: "neutral" as const,
            };
            const Icon = meta.icon;
            const sign = e.amount > 0 ? "+" : "";
            return (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span
                  className={`w-9 h-9 grid place-items-center rounded-xl shrink-0 ${
                    meta.tone === "in"
                      ? "bg-success/15 text-success"
                      : meta.tone === "out"
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "bg-surface-subtle text-ink-500 border border-ink-100"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-deep">{meta.label}</p>
                  <p className="text-xs text-ink-500 truncate">
                    {e.note ?? "—"} · {timeAgo(e.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      e.amount >= 0 ? "text-success" : "text-brand-deep"
                    }`}
                  >
                    {sign}
                    {formatZmw(Math.abs(e.amount))}
                  </p>
                  <p className="text-[10px] text-ink-500">
                    Balance {formatZmw(e.balanceAfter)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
