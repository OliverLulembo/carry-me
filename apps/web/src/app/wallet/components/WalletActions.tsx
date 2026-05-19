"use client";

import { useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { TopUpModal } from "@/app/dashboard/components/TopUpModal";

export function WalletActions({ balance }: { balance: number }) {
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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-600 transition shadow-pop"
        >
          <Plus className="w-4 h-4" size={16} />
          Top up
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-ink-100 bg-white text-ink-700 text-sm font-semibold hover:bg-surface-subtle hover:border-ink-300 transition"
        >
          <Send className="w-4 h-4" size={16} />
          Share credits
        </button>
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-deep/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-credits-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-brand-deep text-white p-6 shadow-xl">
            <p
              id="share-credits-title"
              className="text-xs uppercase tracking-wider text-white/60 font-semibold"
            >
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
                    type="button"
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

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
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
                type="button"
                onClick={doShare}
                disabled={busy || recipient.length < 7}
                className="px-3 py-2.5 rounded-xl bg-white text-brand-deep text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" size={16} />}
                Send K{amount}
              </button>
            </div>
          </div>
        </div>
      )}

      <TopUpModal open={topupOpen} onClose={() => setTopupOpen(false)} balance={balance} />
    </>
  );
}
