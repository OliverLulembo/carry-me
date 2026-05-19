import { NextResponse, type NextRequest } from "next/server";
import { requirePassenger } from "@/lib/passenger";
import { getActivePassengerTap, serializeActiveTap } from "@/lib/taps";
import { lookupFareCredits } from "@/lib/fare";

export async function GET(req: NextRequest) {
  const auth = await requirePassenger(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const tap = await getActivePassengerTap(session.sub);
  if (!tap) {
    return NextResponse.json({ tap: null });
  }

  const payload = serializeActiveTap(tap);

  // Optional fare hints for each possible disembark stop (excluding boarding stop).
  const fareHints: Array<{ stopId: string; creditsPerPassenger: number; totalCredits: number }> =
    [];
  for (const rs of tap.trip.route.stops) {
    if (rs.stop.id === tap.onStopId) continue;
    try {
      const creditsPerPassenger = await lookupFareCredits(
        tap.trip.routeId,
        tap.onStopId,
        rs.stop.id,
      );
      fareHints.push({
        stopId: rs.stop.id,
        creditsPerPassenger,
        totalCredits: creditsPerPassenger * tap.groupSize,
      });
    } catch {
      /* segment not configured — skip */
    }
  }

  return NextResponse.json({ tap: payload, fareHints });
}
