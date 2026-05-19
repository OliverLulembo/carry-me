import { formatZmw, timeAgo } from "@/lib/format";
import {
  formatEntryDate,
  getWalletEntryMeta,
  type WalletEntryRow,
} from "@/lib/wallet-entries";

export function TransactionList({
  entries,
  showFullDate = false,
}: {
  entries: WalletEntryRow[];
  showFullDate?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-500 text-center py-12">
        No transactions yet. Top up your wallet to start riding.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {entries.map((e) => (
        <TransactionRow key={e.id} entry={e} showFullDate={showFullDate} />
      ))}
    </ul>
  );
}

function TransactionRow({
  entry,
  showFullDate,
}: {
  entry: WalletEntryRow;
  showFullDate: boolean;
}) {
  const meta = getWalletEntryMeta(entry.kind);
  const Icon = meta.icon;
  const sign = entry.amount > 0 ? "+" : "";

  return (
    <li className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className={`w-10 h-10 grid place-items-center rounded-xl shrink-0 ${
          meta.tone === "in"
            ? "bg-success/15 text-success"
            : meta.tone === "out"
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-surface-subtle text-ink-500 border border-ink-100"
        }`}
      >
        <Icon className="w-5 h-5" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-deep">{meta.label}</p>
        <p className="text-xs text-ink-500 truncate">
          {entry.note ?? entry.reference ?? "—"}
          {!showFullDate && <> · {timeAgo(entry.createdAt)}</>}
        </p>
        {showFullDate && (
          <p className="text-[11px] text-ink-300 mt-0.5">{formatEntryDate(entry.createdAt)}</p>
        )}
      </div>
      <TransactionAmount entry={entry} sign={sign} />
    </li>
  );
}

function TransactionAmount({ entry, sign }: { entry: WalletEntryRow; sign: string }) {
  return (
    <div className="text-right shrink-0">
      <p
        className={`text-sm font-semibold tabular-nums ${
          entry.amount >= 0 ? "text-success" : "text-brand-deep"
        }`}
      >
        {sign}
        {formatZmw(Math.abs(entry.amount))}
      </p>
      <p className="text-[10px] text-ink-500 tabular-nums">
        Balance {formatZmw(entry.balanceAfter)}
      </p>
    </div>
  );
}
