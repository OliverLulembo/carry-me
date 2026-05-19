import {
  ArrowDown,
  ArrowUp,
  Bus,
  RefreshCw,
  Send,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type WalletEntryRow = {
  id: string;
  amount: number;
  kind: string;
  balanceAfter: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
};

export type WalletEntryTone = "in" | "out" | "neutral";

export type WalletEntryMeta = {
  label: string;
  icon: LucideIcon;
  tone: WalletEntryTone;
};

export const WALLET_ENTRY_KIND_META: Record<string, WalletEntryMeta> = {
  TOPUP: { label: "Top-up", icon: ArrowDown, tone: "in" },
  TRIP_DEBIT: { label: "Trip fare", icon: Bus, tone: "out" },
  TRIP_HOLD: { label: "Held for trip", icon: Wallet, tone: "neutral" },
  TRIP_RELEASE: { label: "Hold released", icon: RefreshCw, tone: "in" },
  SHARE_OUT: { label: "Shared out", icon: Send, tone: "out" },
  SHARE_IN: { label: "Received", icon: ArrowDown, tone: "in" },
  REFUND: { label: "Refund", icon: ArrowDown, tone: "in" },
  ADJUSTMENT: { label: "Adjustment", icon: RefreshCw, tone: "neutral" },
  TRIP_EARNINGS: { label: "Trip earnings", icon: Bus, tone: "in" },
  WITHDRAWAL_OUT: { label: "Withdrawal", icon: ArrowUp, tone: "out" },
};

export function getWalletEntryMeta(kind: string): WalletEntryMeta {
  return (
    WALLET_ENTRY_KIND_META[kind] ?? {
      label: kind.replace(/_/g, " ").toLowerCase(),
      icon: Wallet,
      tone: "neutral",
    }
  );
}

export function formatEntryDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
