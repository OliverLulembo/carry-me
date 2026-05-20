import Link from "next/link";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/app/dashboard/components/DashboardHeader";
import { DriverDashboardHeader } from "@/app/driver/dashboard/components/DriverDashboardHeader";
import { OwnerDashboardHeader } from "@/app/owner/dashboard/components/OwnerDashboardHeader";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  PASSENGER: "Passenger",
  DRIVER: "Driver",
  OWNER: "Bus owner",
  ADMIN: "Administrator",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login/passenger?redirect=%2Fprofile");

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, phone: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login/passenger?redirect=%2Fprofile");

  const memberSince = user.createdAt.toLocaleDateString("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const backHref =
    user.role === "DRIVER"
      ? "/driver/dashboard"
      : user.role === "OWNER"
        ? "/owner/dashboard"
        : user.role === "ADMIN"
          ? "/admin"
          : "/dashboard";

  const header =
    user.role === "DRIVER" ? (
      <DriverDashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
    ) : user.role === "OWNER" ? (
      <OwnerDashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
    ) : (
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
    );

  return (
    <div className="min-h-screen bg-app">
      {header}

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-24 pt-6">
        <div className="mb-6">
          <Link
            href={backHref}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-600"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-deep tracking-tight">Your profile</h1>
          <p className="text-sm text-ink-500 mt-1">Account details for your CarryMe account.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-deep text-white grid place-items-center">
              <User className="w-6 h-6" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-brand-deep">{user.fullName}</p>
              <p className="text-sm text-ink-500">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider font-semibold text-ink-500">
                Phone
              </dt>
              <dd className="mt-1 font-medium text-brand-deep">{user.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider font-semibold text-ink-500">
                Member since
              </dt>
              <dd className="mt-1 font-medium text-brand-deep">{memberSince}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
