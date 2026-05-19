import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePassenger } from "@/lib/passenger";
import { TapError, tapOn } from "@/lib/taps";

const BodySchema = z.object({
  tripId: z.string().min(1),
  stopId: z.string().min(1),
  groupSize: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePassenger(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { tap } = await tapOn({
      passengerId: session.sub,
      tripId: parsed.data.tripId,
      stopId: parsed.data.stopId,
      groupSize: parsed.data.groupSize,
    });

    return NextResponse.json({
      tap: {
        id: tap.id,
        tripId: tap.tripId,
        status: tap.status,
        groupSize: tap.groupSize,
        tappedOnAt: tap.tappedOnAt.toISOString(),
        onStop: tap.onStop,
        busPlate: tap.trip.bus.plate,
        route: tap.trip.route,
      },
      message: "Boarded. Fare is charged when you tap off.",
    });
  } catch (e) {
    if (e instanceof TapError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    throw e;
  }
}
