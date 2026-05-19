import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { loadPassengerTrips } from "@/lib/passenger-trips";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50)));
  const trips = await loadPassengerTrips(session.sub, limit);

  return NextResponse.json({ trips });
}
