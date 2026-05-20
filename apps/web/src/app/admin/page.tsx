import Link from "next/link";
import { db } from "@/lib/db";
import { Bus, MapPin, Route, Users, Smartphone, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [userCount, stopCount, routeCount, deviceCount, tripCount, activeTrips] = await Promise.all([
    db.user.count(),
    db.busStop.count(),
    db.route.count({ where: { active: true } }),
    db.device.count(),
    db.trip.count(),
    db.trip.count({ where: { status: "ACTIVE" } }),
  ]);

  const cards = [
    { href: "/admin/stops", label: "Bus stops", value: stopCount, icon: MapPin },
    { href: "/admin/routes", label: "Active routes", value: routeCount, icon: Route },
    { href: "/admin/users", label: "Users", value: userCount, icon: Users },
    { href: "/admin/devices", label: "Devices", value: deviceCount, icon: Smartphone },
    { href: "/admin/trips", label: "All trips", value: tripCount, icon: Bus },
    {
      href: "/admin/trips?status=ACTIVE",
      label: "Active trips",
      value: activeTrips,
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Platform overview</h2>
        <p className="text-sm text-ink-500 mt-1">
          Manage users, devices, credits, routes, and stops across CarryMe.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ href, label, value, icon: Icon }) => (
          <Link key={href} href={href} className="card p-5 hover:shadow-lg transition group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-ink-500">{label}</p>
                <p className="text-3xl font-bold text-brand-deep mt-1">{value}</p>
              </div>
              <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition">
                <Icon className="w-5 h-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-brand-deep mb-2">Quick actions</h3>
        <ul className="text-sm text-ink-700 space-y-2">
          <li>
            <Link href="/admin/stops" className="text-brand-primary hover:underline">
              Create a stop and pin it on the map
            </Link>
          </li>
          <li>
            <Link href="/admin/routes" className="text-brand-primary hover:underline">
              Configure route stop order and fare matrix
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="text-brand-primary hover:underline">
              Suspend or restore user accounts
            </Link>
          </li>
          <li>
            <Link href="/admin/trips" className="text-brand-primary hover:underline">
              Delete trips and clear tap records from the database
            </Link>
          </li>
          <li>
            <Link href="/admin/credits" className="text-brand-primary hover:underline">
              Issue refunds or wallet adjustments
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
