import { NextResponse, type NextRequest } from "next/server";
import { requireOwner } from "@/lib/owner";
import { getOwnerIncomeStats } from "@/lib/owner-stats";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const [stats, wallet, pendingWithdrawals] = await Promise.all([
    getOwnerIncomeStats(auth.session.sub),
    db.wallet.findUnique({ where: { userId: auth.session.sub } }),
    db.withdrawal.aggregate({
      where: {
        ownerId: auth.session.sub,
        status: { in: ["REQUESTED", "PROCESSING"] },
      },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    ...stats,
    walletBalance: wallet?.balance ?? 0,
    pendingWithdrawalCredits: pendingWithdrawals._sum.amount ?? 0,
  });
}
