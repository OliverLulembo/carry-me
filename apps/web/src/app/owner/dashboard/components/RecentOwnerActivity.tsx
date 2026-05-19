import {
  formatEntryDate,
  getWalletEntryMeta,
  type WalletEntryRow,
} from "@/lib/wallet-entries";
import { formatCredits } from "@/lib/format";

export function RecentOwnerActivity({ entries }: { entries: WalletEntryRow[] }) {
  return (
    <div className="card p-5 h-full">
      <h2 className="text-lg font-semibold text-brand-deep">Wallet activity</h2>
      <p className="text-sm text-ink-500 mt-0.5">Trip earnings and withdrawals</p>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-500 mt-6">No activity yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((e) => {
            const meta = getWalletEntryMeta(e.kind);
            const Icon = meta.icon;
            const sign = e.amount >= 0 ? "+" : "";
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-subtle"
              >
                <div
                  className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
                    meta.tone === "in"
                      ? "bg-success/10 text-success"
                      : meta.tone === "out"
                        ? "bg-danger/10 text-danger"
                        : "bg-ink-100 text-ink-600"
                  }`}
                >
                  <Icon className="w-4 h-4" size={16} />
                </div>
                <ActivityRowContent entry={e} meta={meta} sign={sign} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActivityRowContent({
  entry,
  meta,
  sign,
}: {
  entry: WalletEntryRow;
  meta: ReturnType<typeof getWalletEntryMeta>;
  sign: string;
}) {
  return (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-deep truncate">{meta.label}</p>
        <p className="text-xs text-ink-500 truncate">
          {entry.note ?? formatEntryDate(entry.createdAt)}
        </p>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums shrink-0 ${
          entry.amount >= 0 ? "text-success" : "text-danger"
        }`}
      >
        {sign}
        {formatCredits(Math.abs(entry.amount))}
      </span>
    </>
  );
}
