import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: stopId } = await context.params;
  const updated = await db.stopArrival.updateMany({
    where: {
      userId: session.sub,
      stopId,
      cancelledAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { cancelledAt: new Date() },
  });
  return NextResponse.json({ cancelled: updated.count });
}
