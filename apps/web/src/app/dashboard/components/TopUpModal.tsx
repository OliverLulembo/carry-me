"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Smartphone,
  CreditCard,
  Building2,
  Loader2,
  Check,
  ShieldCheck,
  Bell,
  Sparkles,
} from "lucide-react";
import { formatZmw } from "@/lib/format";

type TabId = "momo" | "card" | "booth";
type Provider = "MTN_MOMO" | "AIRTEL_MONEY" | "ZAMTEL_KWACHA" | "ZEDMOBILE_WALLET";

// Staged flow states drive the multi-step processing UI. Mobile money and card
// have different stages because the real-world flows look different (STK push
// approval vs. instant card authorisation), so simulating both helps the user
// recognise the live experience later.
type FlowState =
  | "idle"
  | "momo_sending"
  | "momo_awaiting"
  | "card_verifying"
  | "card_processing"
  | "success"
  | "error";

type CardForm = { number: string; expiry: string; cvv: string; name: string };

const PRESET_AMOUNTS = [20, 50, 100, 200];

const PROVIDERS: {
  id: Provider;
  label: string;
  logo: string;
}[] = [
  { id: "MTN_MOMO", label: "MTN MoMo", logo: "/payment-logos/momo.png" },
  { id: "AIRTEL_MONEY", label: "Airtel Money", logo: "/payment-logos/airtel.png" },
  { id: "ZAMTEL_KWACHA", label: "Zamtel Money", logo: "/payment-logos/zamtel.png" },
  { id: "ZEDMOBILE_WALLET", label: "Zedmobile Wallet", logo: "/payment-logos/zedmobile.png" },
];

export function TopUpModal({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("momo");
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [provider, setProvider] = useState<Provider>("MTN_MOMO");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState<CardForm>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [flow, setFlow] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);

  const busy =
    flow !== "idle" && flow !== "error" && flow !== "success";

  // Reset transient state shortly after the modal closes (so the unmount
  // doesn't flicker mid-animation if we ever add one).
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setFlow("idle");
      setError(null);
      setCustomAmount("");
      setNotified(false);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC closes the modal, but only when we're not mid-flight.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const effectiveAmount =
    customAmount && Number(customAmount) > 0 ? Number(customAmount) : amount;

  const momoValid = phone.replace(/\D/g, "").length >= 9;
  const cardValid =
    card.number.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvv.length === 3;

  async function persistTopUp(method: Provider | "CARD") {
    const res = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: effectiveAmount, method }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "Top-up failed");
    }
  }

  async function runMomoFlow() {
    setError(null);
    try {
      setFlow("momo_sending");
      await sleep(1300);
      setFlow("momo_awaiting");
      await sleep(2000);
      await persistTopUp(provider);
      setFlow("success");
      await sleep(1600);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Top-up failed");
      setFlow("error");
    }
  }

  async function runCardFlow() {
    setError(null);
    try {
      setFlow("card_verifying");
      await sleep(900);
      setFlow("card_processing");
      await sleep(1500);
      await persistTopUp("CARD");
      setFlow("success");
      await sleep(1600);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setFlow("error");
    }
  }

  const showSuccess = flow === "success";
  const showProcessing = busy;
  const showForm = !showSuccess && !showProcessing;
  const showFooter = showForm; // hide footer during processing and success

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topup-title"
    >
      <button
        type="button"
        aria-label="Close top up"
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm"
      />

      <div className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-pop overflow-hidden flex flex-col max-h-[95vh]">
        {/* Brand header */}
        <div className="relative px-5 pt-5 pb-4 bg-brand-gradient text-white">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-brand-accent/30 blur-2xl pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                Top up wallet
              </p>
              <h2
                id="topup-title"
                className="mt-1 text-2xl font-bold leading-tight"
              >
                Add credits
              </h2>
              <p className="mt-1 text-xs text-white/75">
                Balance ·{" "}
                <span className="font-semibold text-white">
                  {formatZmw(balance)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-4 h-4" size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 bg-surface">
          <div
            className="grid grid-cols-3 gap-1 p-1 bg-surface-subtle rounded-2xl"
            role="tablist"
            aria-label="Top up method"
          >
            <TabButton
              active={tab === "momo"}
              onClick={() => !busy && setTab("momo")}
              icon={<Smartphone className="w-4 h-4" size={16} />}
              label="Mobile"
              fullLabel="Mobile money"
            />
            <TabButton
              active={tab === "card"}
              onClick={() => !busy && setTab("card")}
              icon={<CreditCard className="w-4 h-4" size={16} />}
              label="Card"
              fullLabel="Card"
            />
            <TabButton
              active={tab === "booth"}
              onClick={() => !busy && setTab("booth")}
              icon={<Building2 className="w-4 h-4" size={16} />}
              label="Booth"
              fullLabel="Booth"
              badge="Soon"
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto">
          {showSuccess ? (
            <SuccessView amount={effectiveAmount} />
          ) : showProcessing ? (
            <ProcessingView
              state={flow}
              provider={provider}
              amount={effectiveAmount}
            />
          ) : (
            <>
              {tab === "momo" && (
                <MomoTab
                  provider={provider}
                  setProvider={setProvider}
                  phone={phone}
                  setPhone={setPhone}
                />
              )}
              {tab === "card" && <CardTab card={card} setCard={setCard} />}
              {tab === "booth" && (
                <BoothTab notified={notified} onNotify={() => setNotified(true)} />
              )}

              {tab !== "booth" && (
                <div className="mt-5">
                  <label className="text-xs font-medium text-ink-500">
                    Amount
                  </label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((v) => {
                      const selected = !customAmount && amount === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setAmount(v);
                            setCustomAmount("");
                          }}
                          className={`px-2 py-2 rounded-xl text-sm font-semibold transition ${
                            selected
                              ? "bg-brand-primary text-white shadow-pop"
                              : "bg-surface-subtle text-brand-deep hover:bg-ink-100"
                          }`}
                        >
                          K{v}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm font-medium pointer-events-none">
                      K
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={10}
                      max={2000}
                      placeholder="Other amount (10–2000)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="px-5 pb-5 pt-3 border-t border-ink-100 bg-surface">
            {tab === "booth" ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-500 leading-snug">
                  Pick mobile money or card to top up right now.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-surface-subtle text-brand-deep text-sm font-semibold hover:bg-ink-100 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-surface-subtle text-brand-deep text-sm font-semibold hover:bg-ink-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={tab === "momo" ? runMomoFlow : runCardFlow}
                  disabled={
                    effectiveAmount < 10 ||
                    effectiveAmount > 2000 ||
                    (tab === "momo" && !momoValid) ||
                    (tab === "card" && !cardValid)
                  }
                  className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-pop"
                >
                  {tab === "momo" ? (
                    <Smartphone className="w-4 h-4" size={16} />
                  ) : (
                    <ShieldCheck className="w-4 h-4" size={16} />
                  )}
                  {tab === "momo"
                    ? `Request K${effectiveAmount}`
                    : `Pay K${effectiveAmount}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  fullLabel,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  fullLabel: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`relative flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition ${
        active
          ? "bg-surface text-brand-primary shadow-card"
          : "text-ink-500 hover:text-brand-deep"
      }`}
    >
      <span className={active ? "text-brand-primary" : "text-ink-500"}>
        {icon}
      </span>
      <span className="sm:hidden">{label}</span>
      <span className="hidden sm:inline">{fullLabel}</span>
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-brand-accent text-[9px] font-bold text-brand-deep leading-none uppercase tracking-wide shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

function MomoTab({
  provider,
  setProvider,
  phone,
  setPhone,
}: {
  provider: Provider;
  setProvider: (p: Provider) => void;
  phone: string;
  setPhone: (s: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-500">
        Mobile money provider
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => {
          const active = provider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              aria-label={p.label}
              aria-pressed={active}
              className={`relative flex items-center justify-center min-h-[122px] px-1.5 py-2.5 rounded-xl border-2 transition ${
                active
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-ink-100 hover:border-brand-primary/30 bg-surface"
              }`}
            >
              <span className="flex h-24 w-full max-w-[140px] items-center justify-center overflow-hidden">
                <img
                  src={p.logo}
                  alt={p.label}
                  className="h-[88px] w-[140px] max-h-full max-w-full object-contain"
                />
              </span>
              {active && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary grid place-items-center">
                  <Check className="w-2.5 h-2.5 text-white" size={10} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label
          htmlFor="momo-phone"
          className="text-xs font-medium text-ink-500"
        >
          Mobile money number
        </label>
        <div className="mt-1.5 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm font-medium pointer-events-none">
            +260
          </span>
          <input
            id="momo-phone"
            type="tel"
            inputMode="numeric"
            placeholder="977 000 000"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 12))
            }
            className="w-full pl-14 pr-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition"
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-ink-500 inline-flex items-start gap-1.5">
        <ShieldCheck
          className="w-3.5 h-3.5 mt-0.5 text-ink-500 shrink-0"
          size={14}
        />
        We'll send an approval prompt to your phone. No funds move until you
        confirm.
      </p>
    </div>
  );
}

function CardTab({
  card,
  setCard,
}: {
  card: CardForm;
  setCard: (c: CardForm) => void;
}) {
  function formatCardNumber(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return (
    <div>
      {/* Live card preview keeps the form feeling tactile and confirms what the
          user is typing without needing a separate review screen. */}
      <div className="relative h-28 rounded-2xl p-4 mb-4 overflow-hidden bg-deep-gradient text-white">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-accent/25 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-brand-primary/30 blur-2xl pointer-events-none" />
        <div className="relative h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-90" />
            <CreditCard className="w-5 h-5 opacity-80" size={20} />
          </div>
          <div className="font-mono text-base tracking-[0.18em] truncate">
            {card.number || "•••• •••• •••• ••••"}
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/70 gap-2">
            <span className="truncate">{card.name || "Cardholder name"}</span>
            <span className="shrink-0">{card.expiry || "MM/YY"}</span>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="card-number"
          className="text-xs font-medium text-ink-500"
        >
          Card number
        </label>
        <input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={(e) =>
            setCard({ ...card, number: formatCardNumber(e.target.value) })
          }
          className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition font-mono tracking-wider"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="card-exp"
            className="text-xs font-medium text-ink-500"
          >
            Expiry
          </label>
          <input
            id="card-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={card.expiry}
            onChange={(e) =>
              setCard({ ...card, expiry: formatExpiry(e.target.value) })
            }
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition"
          />
        </div>
        <div>
          <label
            htmlFor="card-cvv"
            className="text-xs font-medium text-ink-500"
          >
            CVV
          </label>
          <input
            id="card-cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={3}
            value={card.cvv}
            onChange={(e) =>
              setCard({
                ...card,
                cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
              })
            }
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition"
          />
        </div>
      </div>

      <div className="mt-3">
        <label
          htmlFor="card-name"
          className="text-xs font-medium text-ink-500"
        >
          Cardholder name
        </label>
        <input
          id="card-name"
          autoComplete="cc-name"
          placeholder="Chanda Mwila"
          value={card.name}
          onChange={(e) => setCard({ ...card, name: e.target.value })}
          className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-surface border border-ink-100 text-brand-deep placeholder-ink-300 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 transition"
        />
      </div>

      <p className="mt-3 text-[11px] text-ink-500 inline-flex items-start gap-1.5">
        <ShieldCheck
          className="w-3.5 h-3.5 mt-0.5 text-ink-500 shrink-0"
          size={14}
        />
        Encrypted in transit. Visa &amp; Mastercard issued in Zambia.
      </p>
    </div>
  );
}

function BoothTab({
  notified,
  onNotify,
}: {
  notified: boolean;
  onNotify: () => void;
}) {
  const booths = [
    { name: "Soweto Market", area: "Lusaka CBD" },
    { name: "Manda Hill bus park", area: "Manda Hill" },
    { name: "Kabwata Roundabout", area: "Kabwata" },
  ];

  return (
    <div>
      <div className="relative rounded-2xl p-6 text-center overflow-hidden bg-gradient-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 border border-brand-primary/15">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-accent/30 blur-2xl pointer-events-none" />
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-brand-gradient grid place-items-center shadow-pop">
          <Building2 className="w-10 h-10 text-white" size={40} />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-accent text-[9px] font-bold text-brand-deep uppercase tracking-wider shadow-sm">
            Coming soon
          </span>
        </div>

        <h3 className="relative mt-6 text-base font-bold text-brand-deep">
          Top up with cash at a CarryMe booth
        </h3>
        <p className="relative mt-1.5 text-sm text-ink-500 max-w-xs mx-auto">
          Visit a partner kiosk to load credits with cash — no app, no mobile
          money required.
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          First locations going live
        </p>
        <ul className="mt-2 space-y-1.5">
          {booths.map((b) => (
            <li
              key={b.name}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-subtle"
            >
              <span className="w-7 h-7 grid place-items-center rounded-lg bg-surface text-brand-primary border border-ink-100">
                <Building2 className="w-3.5 h-3.5" size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-deep truncate">
                  {b.name}
                </p>
                <p className="text-[11px] text-ink-500">{b.area}</p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                Soon
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onNotify}
        disabled={notified}
        className={`mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
          notified
            ? "bg-success/10 text-success cursor-default"
            : "bg-brand-secondary text-brand-deep hover:bg-brand-secondary-600 shadow-pop"
        }`}
      >
        {notified ? (
          <>
            <Check className="w-4 h-4" size={16} strokeWidth={3} />
            We'll let you know
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" size={16} />
            Notify me when booths go live
          </>
        )}
      </button>
    </div>
  );
}

function ProcessingView({
  state,
  provider,
  amount,
}: {
  state: FlowState;
  provider: Provider;
  amount: number;
}) {
  const providerLabel =
    PROVIDERS.find((p) => p.id === provider)?.label ?? "Mobile money";

  const stages: Record<
    string,
    { title: string; body: string; icon: React.ReactNode; step: 1 | 2 }
  > = {
    momo_sending: {
      title: `Requesting K${amount}…`,
      body: `Sending an approval prompt to your ${providerLabel} app.`,
      icon: <Loader2 className="w-7 h-7 animate-spin" size={28} />,
      step: 1,
    },
    momo_awaiting: {
      title: "Check your phone",
      body: `Open ${providerLabel} and approve the K${amount} request to finish.`,
      icon: <Smartphone className="w-7 h-7 animate-pulse" size={28} />,
      step: 2,
    },
    card_verifying: {
      title: "Verifying card…",
      body: "Checking the card details with your bank.",
      icon: <Loader2 className="w-7 h-7 animate-spin" size={28} />,
      step: 1,
    },
    card_processing: {
      title: `Authorising K${amount}…`,
      body: "Processing the payment securely.",
      icon: <ShieldCheck className="w-7 h-7" size={28} />,
      step: 2,
    },
  };

  const s = stages[state];
  if (!s) return null;

  return (
    <div className="text-center py-6">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary grid place-items-center">
        {s.icon}
      </div>
      <h3 className="mt-4 text-base font-bold text-brand-deep">{s.title}</h3>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs mx-auto">{s.body}</p>
      <div
        className="mt-5 flex items-center justify-center gap-1.5"
        aria-hidden="true"
      >
        <Dot active={s.step >= 1} pulse={s.step === 1} />
        <Dot active={s.step >= 2} pulse={s.step === 2} />
        <Dot active={false} />
      </div>
    </div>
  );
}

function Dot({ active, pulse }: { active: boolean; pulse?: boolean }) {
  return (
    <span
      className={`w-2 h-2 rounded-full transition ${
        active
          ? `bg-brand-primary ${pulse ? "animate-pulse" : ""}`
          : "bg-ink-100"
      }`}
    />
  );
}

function SuccessView({ amount }: { amount: number }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 rounded-full bg-success/15 grid place-items-center relative">
        <span className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
        <Check
          className="relative w-8 h-8 text-success"
          size={32}
          strokeWidth={3}
        />
      </div>
      <h3 className="mt-4 text-lg font-bold text-brand-deep">All set</h3>
      <p className="mt-1.5 text-sm text-ink-500">
        <span className="font-semibold text-brand-deep">
          {formatZmw(amount)}
        </span>{" "}
        added to your wallet.
      </p>
      <p className="mt-1 text-[11px] text-ink-500 inline-flex items-center gap-1">
        <Sparkles className="w-3 h-3" size={12} /> Ready to tap to ride.
      </p>
    </div>
  );
}
