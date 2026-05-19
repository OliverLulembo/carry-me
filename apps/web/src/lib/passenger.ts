import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "./auth";
import type { SessionClaims } from "./jwt";
import { db } from "./db";

export async function requirePassenger(
  req: NextRequest,
): Promise<{ session: SessionClaims } | NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "PASSENGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { suspendedAt: true },
  });
  if (!user || user.suspendedAt) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }
  return { session };
}
