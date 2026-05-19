import { Bus, User } from "lucide-react";
import { formatZmw, timeAgo } from "@/lib/format";

export type ManifestEntry = {
  id: string;
  passengerName: string;
  onStopName: string;
  offStopName: string | null;
  groupSize: number;
  reservedCredits: number;
  status: string;
  tappedOnAt: string;
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  HELD: { label: "On board", tone: "bg-brand-primary/10 text-brand-primary" },
  SETTLED: { label: "Settled", tone: "bg-success/15 text-success" },
  CANCELLED: { label: "Rejected", tone: "bg-danger/10 text-danger" },
  FLAGGED: { label: "Flagged", tone: "bg-warn/15 text-warn" },
};

export function PassengerManifest({ entries }: { entries: ManifestEntry[] }) {
  const onboard = entries.filter((e) => e.status === "HELD");

  return (
    <div id="manifest" className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-brand-deep flex items-center gap-2">
            <Bus className="w-4 h-4 text-brand-primary" size={16} />
            Passenger manifest
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {onboard.length} currently on board
            {entries.length > onboard.length
              ? ` · ${entries.length - onboard.length} recent`
              : ""}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-8">
          No passengers yet. Tap a phone or card on your reader to board someone.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {entries.map((e) => {
            const meta = STATUS_LABEL[e.status] ?? {
              label: e.status,
              tone: "bg-surface-subtle text-ink-500",
            };
            return (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="w-9 h-9 grid place-items-center rounded-xl shrink-0 bg-brand-primary/10 text-brand-primary">
                  <User className="w-4.5 h-4.5" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-deep">
                    {e.passengerName}
                    {e.groupSize > 1 ? ` + ${e.groupSize - 1}` : ""}
                  </p>
                  <p className="text-xs text-ink-500 truncate">
                    {e.onStopName}
                    {e.offStopName ? ` → ${e.offStopName}` : " → end of route"} ·{" "}
                    {timeAgo(e.tappedOnAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-brand-deep">
                    {formatZmw(e.reservedCredits)}
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
