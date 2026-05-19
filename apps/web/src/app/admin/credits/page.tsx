import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { CreditsPanel } from "../components/CreditsPanel";

export const dynamic = "force-dynamic";

export default async function AdminCreditsPage() {
  const users = await db.user.findMany({
    where: { role: UserRole.PASSENGER },
    orderBy: { fullName: "asc" },
    include: { wallet: { select: { balance: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Credits</h2>
        <p className="text-sm text-ink-500 mt-1">
          Issue refunds and manual wallet adjustments with a required audit note.
        </p>
      </div>
      <CreditsPanel
        users={users.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          phone: u.phone,
          balance: u.wallet?.balance ?? null,
        }))}
      />
    </div>
  );
}
