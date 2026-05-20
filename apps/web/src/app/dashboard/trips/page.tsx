import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "../components/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/");

  const trips = await db.tap.findMany({
    where: { passengerId: user.id },
    orderBy: { tappedOnAt: "desc" },
    take: 20,
    include: {
      onStop: true,
      offStop: true,
      trip: { include: { bus: true, route: true } },
    },
  });

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-2xl bg-brand-primary p-6 text-white shadow-pop">
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="mt-1 text-sm text-white/80">Your recent boarding payments and rides.</p>
        </section>
        <section className="card p-5 mt-5">
          {trips.length === 0 ? (
            <p className="text-sm text-ink-500">No trips yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {trips.map((tap) => (
                <li key={tap.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-brand-deep">{tap.trip.route.name}</p>
                    <p className="text-xs text-ink-500">
                      {tap.onStop.name}
                      {tap.offStop ? ` to ${tap.offStop.name}` : ""} on {tap.trip.bus.plate}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-brand-primary">
                    {tap.finalCredits ?? tap.reservedCredits} credits
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
