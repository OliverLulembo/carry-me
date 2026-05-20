import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireDriver } from "@/lib/driver";
import { TripArrivalError, driverArriveAtStop } from "@/lib/trip-arrival";

const BodySchema = z.object({
  stopId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { id: tripId } = await context.params;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await driverArriveAtStop({
      driverId: session.sub,
      tripId,
      stopId: body.stopId,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof TripArrivalError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    throw e;
  }
}
