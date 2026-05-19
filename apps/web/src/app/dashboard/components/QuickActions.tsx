import { Nfc, Users, ScanLine, Map } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      icon: Nfc,
      label: "Tap to board",
      sub: "Hold phone near driver",
      tone: "primary" as const,
    },
    {
      icon: Users,
      label: "Boarding as a group",
      sub: "Pay for up to 10",
      tone: "secondary" as const,
    },
    {
      icon: ScanLine,
      label: "Scan a card",
      sub: "Link a CarryMe card",
      tone: "neutral" as const,
    },
    {
      icon: Map,
      label: "Plan a route",
      sub: "Coming soon",
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-deep">Quick actions</h3>
        <p className="text-xs text-ink-500">Most common things you'll do</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(({ icon: Icon, label, sub, tone }) => (
          <button
            key={label}
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
