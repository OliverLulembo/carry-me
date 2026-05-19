import { LogOut, MapPin, Nfc, Radio } from "lucide-react";

export function DriverQuickActions() {
  const actions = [
    {
      icon: Nfc,
      label: "Tap passenger",
      sub: "Hold reader to phone or card",
      tone: "primary" as const,
    },
    {
      icon: MapPin,
      label: "Update location",
      sub: "Sync GPS to passengers",
      tone: "secondary" as const,
    },
    {
      icon: Radio,
      label: "Offline mode",
      sub: "Queue taps when offline",
      tone: "neutral" as const,
    },
    {
      icon: LogOut,
      label: "End shift",
      sub: "Close active trip",
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-deep">Quick actions</h3>
        <p className="text-xs text-ink-500">Most common things you&apos;ll do</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(({ icon: Icon, label, sub, tone }) => (
          <button
            key={label}
            type="button"
            className="group flex items-start gap-3 p-4 rounded-2xl border border-ink-100 hover:border-brand-primary/30 hover:bg-surface-subtle transition text-left"
          >
            <span
              className={`w-10 h-10 grid place-items-center rounded-xl shrink-0 ${
                tone === "primary"
                  ? "bg-brand-primary text-white"
                  : tone === "secondary"
                    ? "bg-brand-secondary text-brand-deep"
                    : "bg-surface-subtle text-brand-deep border border-ink-100"
              }`}
            >
              <Icon className="w-5 h-5" size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-deep">{label}</p>
              <p className="text-xs text-ink-500 mt-0.5">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
