"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { formatCredits, formatZmw } from "@/lib/format";

export type WithdrawalRow = {
  id: string;
  amount: number;
  method: string;
  destination: string;
  status: string;
  requestedAt: string;
};

const METHODS = [
  { value: "MTN_MOMO", label: "MTN MoMo" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "ZAMTEL_KWACHA", label: "Zamtel Kwacha" },
  { value: "BANK", label: "Bank transfer" },
] as const;

const MIN_WITHDRAWAL = 50;

export function WithdrawPanel({
  initialBalance,
  initialWithdrawals,
}: {
  initialBalance: number;
  initialWithdrawals: WithdrawalRow[];
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [amount, setAmount] = useState(Math.min(initialBalance, 100));
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("MTN_MOMO");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/owner/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, destination: destination.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");

      setBalance(data.balance);
      setMessage(
        `Withdrawal of ${formatZmw(data.withdrawal.amount)} submitted (${data.withdrawal.status}).`,
      );
      setDestination("");

      const listRes = await fetch("/api/owner/withdrawals");
      const listData = await listRes.json();
      if (listRes.ok) setWithdrawals(listData.withdrawals);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const canWithdraw = balance >= MIN_WITHDRAWAL;

  return (
    <div id="withdraw" className="card p-5 space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-lg font-semibold text-brand-deep flex items-center gap-2">
          <Wallet className="w-5 h-5 text-brand-primary" size={20} />
          Withdraw to cash
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          Convert earned credits to ZMW via Mobile Money or bank (dev: instant processing).
        </p>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-3 max-w-md">
        <label className="block">
          <span className="text-xs font-medium text-ink-500">Amount (credits)</span>
          <input
            type="number"
            min={MIN_WITHDRAWAL}
            max={balance}
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={!canWithdraw}
            required
          />
          <p className="text-[11px] text-ink-500 mt-1">
            Min {formatCredits(MIN_WITHDRAWAL)} · Available {formatCredits(balance)}
          </p>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-500">Payout method</span>
          <select
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm bg-white"
            value={method}
            onChange={(e) =>
              setMethod(e.target.value as (typeof METHODS)[number]["value"])
            }
            disabled={!canWithdraw}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-500">
            {method === "BANK" ? "Account number" : "Mobile number"}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 text-sm"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={method === "BANK" ? "01XXXXXXXX" : "+26097XXXXXXX"}
            disabled={!canWithdraw}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || !canWithdraw}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" size={16} />
          ) : (
            <ArrowUpRight className="w-4 h-4" size={16} />
          )}
          Withdraw {formatZmw(amount)}
        </button>
      </form>

      {!canWithdraw && (
        <p className="text-sm text-ink-500">
          Earn at least {formatZmw(MIN_WITHDRAWAL)} from trips before withdrawing.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      {withdrawals.length > 0 && (
        <div className="pt-4 border-t border-ink-100">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">
            Recent withdrawals
          </p>
          <ul className="space-y-2">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-surface-subtle"
              >
                <span className="text-ink-700">
                  {formatZmw(w.amount)} → {w.method.replace(/_/g, " ")}
                  <span className="text-ink-500"> · {w.destination}</span>
                </span>
                <span className="text-xs font-medium uppercase text-ink-500">{w.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
