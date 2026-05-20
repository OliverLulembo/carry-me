import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "../components/DashboardHeader";

export default async function SupportPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-app">
      <DashboardHeader user={{ fullName: user.fullName, phone: user.phone }} />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-2xl bg-brand-primary p-6 text-white shadow-pop">
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-white/80">Get help with payments, trips, and linked devices.</p>
        </section>
        <section className="card p-5 mt-5 space-y-3 text-sm text-ink-700">
          <p><span className="font-semibold text-brand-deep">Payments:</span> Fare is paid when you board.</p>
          <p><span className="font-semibold text-brand-deep">Phone:</span> +260 977 000 000</p>
          <p><span className="font-semibold text-brand-deep">Email:</span> support@carryme.local</p>
        </section>
      </main>
    </div>
  );
}
