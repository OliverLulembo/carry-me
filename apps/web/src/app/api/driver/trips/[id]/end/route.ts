import { NextResponse, type NextRequest } from "next/server";
import { TripStatus } from "@prisma/client";
import { requireDriver } from "@/lib/driver";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;

  const trip = await db.trip.findFirst({
    where: { id, driverId: session.sub, status: TripStatus.ACTIVE },
  });
  if (!trip) {
    return NextResponse.json({ error: "Active trip not found" }, { status: 404 });
  }

  await db.trip.update({
    where: { id },
    data: { status: TripStatus.COMPLETED, endedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
