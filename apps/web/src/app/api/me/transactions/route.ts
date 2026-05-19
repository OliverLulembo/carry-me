import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 10)));

  const wallet = await db.wallet.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });
  if (!wallet) return NextResponse.json({ entries: [] });

  const entries = await db.walletEntry.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      kind: true,
      balanceAfter: true,
      reference: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries });
}
