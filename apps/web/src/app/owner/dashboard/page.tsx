import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOwnerIncomeStats } from "@/lib/owner-stats";
import { OwnerDashboardHeader } from "./components/OwnerDashboardHeader";
import { OwnerBalanceCard } from "./components/OwnerBalanceCard";
import { IncomeStatsCard } from "./components/IncomeStatsCard";
import { BusFleetManager, type OwnerBus } from "./components/BusFleetManager";
import { WithdrawPanel, type WithdrawalRow } from "./components/WithdrawPanel";
import { DriverManager, type OwnerDriver } from "./components/DriverManager";
import { RecentOwnerActivity } from "./components/RecentOwnerActivity";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login/owner?redirect=%2Fowner%2Fdashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, fullName: true, phone: true, role: true, wallet: true },
  });
  if (!user) redirect("/login/owner?redirect=%2Fowner%2Fdashboard");
  if (user.role === "PASSENGER") redirect("/dashboard");
  if (user.role === "DRIVER") redirect("/driver/dashboard");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role !== "OWNER") redirect("/login/owner?redirect=%2Fowner%2Fdashboard");

  if (!user.wallet) {
    await db.wallet.create({ data: { userId: user.id, balance: 0 } });
    redirect("/owner/dashboard");
  }

  const [stats, buses, routes, withdrawals, recentEntries, drivers] = await Promise.all([
    getOwnerIncomeStats(user.id),
    db.bus.findMany({
      where: { ownerId: user.id },
      orderBy: { plate: "asc" },
      include: {
        defaultRoute: { select: { id: true, name: true } },
        _count: { select: { trips: true } },
      },
    }),
    db.route.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.withdrawal.findMany({
      where: { ownerId: user.id },
      orderBy: { requestedAt: "desc" },
      take: 8,
    }),
    db.walletEntry.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.user.findMany({
      where: { invitedByOwnerId: user.id, role: "DRIVER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        suspendedAt: true,
      },
    }),
  ]);

  const initialBuses: OwnerBus[] = buses.map((b) => ({
    id: b.id,
    plate: b.plate,
    capacity: b.capacity,
    active: b.active,
    defaultRouteId: b.defaultRouteId,
    defaultRouteName: b.defaultRoute?.name ?? null,
    createdAt: b.createdAt.toISOString(),
    tripCount: b._count.trips,
  }));

  const initialWithdrawals: WithdrawalRow[] = withdrawals.map((w) => ({
    id: w.id,
    amount: w.amount,
    method: w.method,
    destination: w.destination,
    status: w.status,
    requestedAt: w.requestedAt.toISOString(),
  }));

  const initialDrivers: OwnerDriver[] = drivers.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    phone: d.phone,
    email: d.email,
    createdAt: d.createdAt.toISOString(),
    suspendedAt: d.suspendedAt?.toISOString() ?? null,
  }));

  return (
    <div className="min-h-screen bg-app">
      <OwnerDashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-12 lg:col-span-5">
            <OwnerBalanceCard
              balance={user.wallet.balance}
              todayCredits={stats.todayCredits}
              totalBuses={stats.totalBuses}
              activeBuses={stats.activeBuses}
            />
          </section>

          <section className="col-span-12 lg:col-span-7">
            <IncomeStatsCard
              todayCredits={stats.todayCredits}
              weekCredits={stats.weekCredits}
              monthCredits={stats.monthCredits}
              todayTrips={stats.todayTrips}
              weekTrips={stats.weekTrips}
              byBus={stats.byBus}
            />
          </section>

          <section className="col-span-12">
            <DriverManager initialDrivers={initialDrivers} />
          </section>

          <section className="col-span-12">
            <BusFleetManager initialBuses={initialBuses} routes={routes} />
          </section>

          <section className="col-span-12 lg:col-span-6">
            <WithdrawPanel
              initialBalance={user.wallet.balance}
              initialWithdrawals={initialWithdrawals}
            />
          </section>

          <section className="col-span-12 lg:col-span-6">
            <RecentOwnerActivity
              entries={recentEntries.map((e) => ({
                id: e.id,
                amount: e.amount,
                kind: e.kind,
                note: e.note,
                reference: e.reference,
                balanceAfter: e.balanceAfter,
                createdAt: e.createdAt.toISOString(),
              }))}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
