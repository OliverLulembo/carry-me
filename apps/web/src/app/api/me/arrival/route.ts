import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

/** Returns the passenger's active "I'm here" stop arrival, if any. */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const liveArrival = await db.stopArrival.findFirst({
    where: {
      userId: session.sub,
      cancelledAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { loggedAt: "desc" },
    include: { stop: { select: { id: true, name: true, lat: true, lng: true } } },
  });

  if (!liveArrival) {
    return NextResponse.json({ arrival: null });
  }

  const destination = liveArrival.destinationStopId
    ? await db.busStop.findUnique({
        where: { id: liveArrival.destinationStopId },
        select: { id: true, name: true, lat: true, lng: true },
      })
    : null;

  return NextResponse.json({
    arrival: {
      id: liveArrival.id,
      stopId: liveArrival.stopId,
      stopName: liveArrival.stop.name,
      stopLat: liveArrival.stop.lat,
      stopLng: liveArrival.stop.lng,
      destinationStopId: liveArrival.destinationStopId,
      destination,
      expiresAt: liveArrival.expiresAt.toISOString(),
    },
  });
}
