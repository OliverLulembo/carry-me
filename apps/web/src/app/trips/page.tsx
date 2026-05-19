import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadPassengerTrips } from "@/lib/passenger-trips";
import { formatZmw } from "@/lib/format";
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader";
import { TripsList } from "./components/TripsList";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const session = await getSession();
  if (!session) redirect("/login/passenger?redirect=%2Ftrips");

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, phone: true, role: true },
  });
  if (!user) redirect("/login/passenger?redirect=%2Ftrips");
  if (user.role === "DRIVER") redirect("/driver/dashboard");
  if (user.role === "ADMIN") redirect("/admin");

  const trips = await loadPassengerTrips(session.sub);

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tripsThisWeek = trips.filter((t) => new Date(t.tappedOnAt) >= weekStart).length;
  const totalSpent = trips
    .filter((t) => t.status === "SETTLED" && t.finalCredits != null)
    .reduce((sum, t) => sum + (t.finalCredits ?? 0), 0);
  const onBoard = trips.some((t) => t.status === "HELD");

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader
        user={{ fullName: user.fullName, phone: user.phone }}
        activeNav="trips"
      />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-deep tracking-tight">Your trips</h1>
          <p className="text-sm text-ink-500 mt-1">
            Every ride you&apos;ve taken on CarryMe, with route, stops, and fare details.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total rides" value={String(trips.length)} />
          <StatCard label="This week" value={String(tripsThisWeek)} />
          <StatCard label="Total spent" value={formatZmw(totalSpent)} />
        </div>

        {onBoard && (
          <div className="mb-4 rounded-xl border border-brand-primary/25 bg-brand-primary/5 px-4 py-3 text-sm text-brand-deep">
            You have an active ride.{" "}
            <Link href="/dashboard" className="font-semibold text-brand-primary hover:underline">
              Return to dashboard
            </Link>{" "}
            to tap off when you arrive.
          </div>
        )}

        <div className="card p-5 sm:p-6">
          <TripsList trips={trips} />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3 sm:px-4 text-center">
      <p className="text-lg sm:text-xl font-bold text-brand-deep">{value}</p>
      <p className="text-[10px] sm:text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}
