import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const trip = await db.trip.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  await db.$transaction([
    db.tap.deleteMany({ where: { tripId: id } }),
    db.trip.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, deletedId: id });
}
