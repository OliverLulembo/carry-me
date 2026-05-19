import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePassenger } from "@/lib/passenger";
import { TapError, tapOff } from "@/lib/taps";

const BodySchema = z.object({
  stopId: z.string().min(1),
  tapId: z.string().min(1).optional(),
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
    const result = await tapOff({
      passengerId: session.sub,
      stopId: parsed.data.stopId,
      tapId: parsed.data.tapId,
    });

    return NextResponse.json({
      tap: {
        id: result.tap.id,
        status: result.tap.status,
        groupSize: result.tap.groupSize,
        tappedOnAt: result.tap.tappedOnAt.toISOString(),
        tappedOffAt: result.tap.tappedOffAt?.toISOString() ?? null,
        onStop: result.tap.onStop,
        offStop: result.tap.offStop,
        finalCredits: result.tap.finalCredits,
        busPlate: result.tap.trip.bus.plate,
        route: result.tap.trip.route,
      },
      fare: result.fare,
      balance: result.balance,
      message: `Charged ${result.fare.totalCredits} credits for your trip.`,
    });
  } catch (e) {
    if (e instanceof TapError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    throw e;
  }
}
