import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatZmw } from "@/lib/format";
import { DashboardHeader } from "../components/DashboardHeader";
import { RecentActivity } from "../components/RecentActivity";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { wallet: { include: { entries: { orderBy: { createdAt: "desc" }, take: 20 } } } },
  });
  if (!user || !user.wallet) redirect("/");

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-2xl bg-brand-primary p-6 text-white shadow-pop">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Wallet</p>
          <h1 className="mt-1 text-3xl font-bold">{formatZmw(user.wallet.balance)}</h1>
          <p className="mt-1 text-sm text-white/80">Available for boarding payments.</p>
        </section>
        <div className="mt-5">
          <RecentActivity
            entries={user.wallet.entries.map((e) => ({
              id: e.id,
              amount: e.amount,
              kind: e.kind,
              note: e.note,
              createdAt: e.createdAt.toISOString(),
              balanceAfter: e.balanceAfter,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
