import { NextResponse, type NextRequest } from "next/server";
import { requireDriver } from "@/lib/driver";
import { TripArrivalError, driverDepartStop } from "@/lib/trip-arrival";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { id: tripId } = await context.params;

  try {
    const result = await driverDepartStop({
      driverId: session.sub,
      tripId,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof TripArrivalError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    throw e;
  }
}
