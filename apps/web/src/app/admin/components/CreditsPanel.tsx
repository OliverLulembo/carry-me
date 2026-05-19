"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type UserOption = { id: string; fullName: string; phone: string; balance: number | null };

export function CreditsPanel({ users }: { users: UserOption[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [amount, setAmount] = useState(50);
  const [kind, setKind] = useState<"REFUND" | "ADJUSTMENT">("ADJUSTMENT");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const signed = kind === "REFUND" ? Math.abs(amount) : amount;
    const res = await fetch("/api/admin/wallet/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: signed, kind, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed");
    } else {
      setResult(`New balance: ${data.balance} credits`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={submit} className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-brand-deep">Adjust wallet credits</h2>
        <p className="text-sm text-ink-500">
          Issue refunds or manual adjustments. A reason note is required for audit.
        </p>
        <label className="block">
          <span className="text-xs text-ink-500">User</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.phone})
                {u.balance !== null ? ` — ${u.balance} cr` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "REFUND" | "ADJUSTMENT")}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
          >
            <option value="ADJUSTMENT">Adjustment (+ or −)</option>
            <option value="REFUND">Refund (credit in)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">
            Amount (credits){kind === "ADJUSTMENT" ? " — use negative to debit" : ""}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value, 10))}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-500">Reason (required)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            minLength={3}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-ink-100"
            placeholder="e.g. Dispute resolution for trip #..."
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && <p className="text-sm text-green-700">{result}</p>}
        <button
          type="submit"
          disabled={loading || !userId}
          className="w-full py-3 rounded-xl bg-brand-primary text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Apply adjustment
        </button>
      </form>
    </div>
  );
}
