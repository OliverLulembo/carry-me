import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";
import { AdminNav } from "./components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  if (!session) {
    redirect("/api/auth/dev-login?phone=%2B260977000004&redirect=%2Fadmin");
  }

  const admin = await db.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true },
  });

  return (
    <main className="min-h-screen bg-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <header className="mb-6 lg:mb-8">
          <p className="text-sm text-ink-500">Signed in as</p>
          <h1 className="text-2xl font-bold text-brand-deep">
            {admin?.fullName ?? "Admin"}
          </h1>
        </header>
        <div className="flex flex-col lg:flex-row gap-6">
          <AdminNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
