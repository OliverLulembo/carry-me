import Link from "next/link";
import { TransactionList } from "@/components/wallet/TransactionList";
import type { WalletEntryRow } from "@/lib/wallet-entries";

export function RecentActivity({ entries }: { entries: WalletEntryRow[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-deep">Recent activity</h3>
        <Link
          href="/wallet"
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600"
        >
          See all →
        </Link>
      </div>
      <TransactionList entries={entries} />
    </div>
  );
}
