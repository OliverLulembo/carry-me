"use client";

import { useState } from "react";
import { formatZmw, formatCredits, timeAgo } from "@/lib/format";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Send,
  Loader2,
  Smartphone,
  CreditCard,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TopUpModal } from "./TopUpModal";

export type LinkedDeviceType = "PHONE" | "CARD" | "WRISTBAND";

export type LinkedDevice = {
  id: string;
  type: LinkedDeviceType;
  label: string | null;
  active: boolean;
  lastSeenAt: string | null;
};

const DEVICE_ICON: Record<LinkedDeviceType, LucideIcon> = {
  PHONE: Smartphone,
  CARD: CreditCard,
  WRISTBAND: Watch,
};

const DEVICE_DEFAULT_LABEL: Record<LinkedDeviceType, string> = {
  PHONE: "Phone",
  CARD: "NFC card",
  WRISTBAND: "Wristband",
};

const DEVICE_TYPE_LABEL: Record<LinkedDeviceType, string> = {
  PHONE: "Phone · Android HCE",
  CARD: "NFC card",
  WRISTBAND: "Wristband",
};

export function BalanceCard({
  balance,
  tripsThisWeek,
  devices = [],
}: {
  balance: number;
  tripsThisWeek: number;
  devices?: LinkedDevice[];
}) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(50);
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function doShare() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/share-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientPhone: recipient, amount }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Share failed");
      setShareOpen(false);
      setRecipient("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card p-6 h-full flex flex-col text-ink-700 relative overflow-hidden shadow-pop">
        {/* Decorative orbs — subtle brand-primary ambient on the white card */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-brand-secondary/20 blur-2xl pointer-events-none" />

        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
            Balance
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-brand-deep">{formatZmw(balance)}</span>
          </div>
          <p className="text-xs text-ink-500 mt-1">{formatCredits(balance)} available</p>

          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle text-ink-700">
              {tripsThisWeek} {tripsThisWeek === 1 ? "trip" : "trips"} this week
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={() => setTopupOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-600 transition shadow-pop"
            >
              <Plus className="w-4 h-4" size={16} /> Top up
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-ink-100 bg-white text-ink-700 text-sm font-semibold hover:bg-surface-subtle hover:border-ink-300 transition"
            >
              <Send className="w-4 h-4" size={16} /> Share
            </button>
          </div>

          <LinkedDevicesList devices={devices} />
        </div>

        {shareOpen && (
          <div className="absolute inset-0 z-10 bg-brand-deep/90 backdrop-blur-md p-6 flex flex-col">
            <p className="text-xs uppercase tracking-wider text-white/60 font-semibold">
              Share credits
            </p>

            <div className="mt-4">
              <label className="text-xs text-white/70">Recipient phone</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+260 977 000 002"
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs text-white/70">Amount</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[20, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`px-2 py-2 rounded-xl text-sm font-semibold transition ${
                      amount === v
                        ? "bg-white text-brand-deep"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    K{v}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-200 bg-red-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setShareOpen(false);
                  setError(null);
                }}
                disabled={busy}
                className="px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={doShare}
                disabled={busy || recipient.length < 7}
                className="px-3 py-2.5 rounded-xl bg-white text-brand-deep text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" size={16} />}
                Send K{amount}
              </button>
            </div>
          </div>
        )}
      </div>

      <TopUpModal
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        balance={balance}
      />
    </>
  );
}

function LinkedDevicesList({ devices }: { devices: LinkedDevice[] }) {
  const activeCount = devices.filter((d) => d.active).length;
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 pt-5 border-t border-ink-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
          Linked devices
        </p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink-700 px-2 py-1 rounded-full border border-ink-100 bg-surface-subtle hover:bg-white tabular-nums"
        >
          {activeCount}/{devices.length || 0} active
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {!open ? null : devices.length === 0 ? (
        <div className="px-3 py-4 rounded-xl border border-ink-100 bg-surface-subtle text-center">
          <p className="text-xs font-medium text-ink-700">
            No devices linked yet
          </p>
          <p className="text-[11px] text-ink-500 mt-0.5">
            Multi-device support arrives in v1.1
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {devices.map((d) => {
            const Icon = DEVICE_ICON[d.type];
            const subtitle = d.lastSeenAt
              ? `${DEVICE_TYPE_LABEL[d.type]} · seen ${timeAgo(d.lastSeenAt)}`
              : `${DEVICE_TYPE_LABEL[d.type]} · never synced`;

            return (
              <li
                key={d.id}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-ink-100 bg-surface-subtle hover:bg-white hover:border-ink-300 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-primary" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-ink-700 truncate">
                      {d.label ?? DEVICE_DEFAULT_LABEL[d.type]}
                    </p>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        d.active
                          ? "bg-brand-primary ring-2 ring-brand-primary/30"
                          : "bg-ink-300"
                      }`}
                      aria-label={d.active ? "Active" : "Inactive"}
                    />
                  </div>
                  <p className="text-[11px] text-ink-500 truncate">
                    {subtitle}
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
