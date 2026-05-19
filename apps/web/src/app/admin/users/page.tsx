import { db } from "@/lib/db";
import { UsersPanel } from "../components/UsersPanel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      wallet: { select: { balance: true } },
      _count: { select: { devices: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-deep">Users</h2>
        <p className="text-sm text-ink-500 mt-1">
          Search, suspend, and restore accounts across all roles.
        </p>
      </div>
      <UsersPanel
        initialUsers={users.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          suspendedAt: u.suspendedAt?.toISOString() ?? null,
          balance: u.wallet?.balance ?? null,
          deviceCount: u._count.devices,
        }))}
      />
    </div>
  );
}
