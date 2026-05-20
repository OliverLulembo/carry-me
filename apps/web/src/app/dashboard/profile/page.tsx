import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "../components/DashboardHeader";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/");
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-2xl bg-brand-primary p-6 text-white shadow-pop">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="mt-1 text-sm text-white/80">Your passenger account details.</p>
        </section>
        <section className="card p-5 mt-5 grid gap-3 text-sm">
          <p><span className="font-semibold text-brand-deep">Name:</span> {user.fullName}</p>
          <p><span className="font-semibold text-brand-deep">Phone:</span> {user.phone}</p>
          <p><span className="font-semibold text-brand-deep">Role:</span> {user.role}</p>
        </section>
      </main>
    </div>
  );
}
