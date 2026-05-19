import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await db.wallet.findUnique({
    where: { userId: session.sub },
    select: { id: true, balance: true, updatedAt: true },
  });
  if (!wallet) return NextResponse.json({ error: "No wallet" }, { status: 404 });

  return NextResponse.json({ wallet });
}
