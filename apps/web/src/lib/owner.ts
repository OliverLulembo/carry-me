import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest, getSession } from "./auth";
import type { SessionClaims } from "./jwt";
import { db } from "./db";

export async function requireOwner(
  req: NextRequest,
): Promise<{ session: SessionClaims } | NextResponse> {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "OWNER") {
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

export async function requireOwnerPage(): Promise<SessionClaims | null> {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { suspendedAt: true },
  });
  if (!user || user.suspendedAt) return null;
  return session;
}
