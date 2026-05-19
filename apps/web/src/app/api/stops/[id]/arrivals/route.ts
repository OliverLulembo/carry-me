import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

const Schema = z.object({
  destinationStopId: z.string().min(1).optional(),
});

// Log "I'm at this stop" (PRD P-7). Expires in 30 minutes.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: stopId } = await context.params;
  const stop = await db.busStop.findUnique({ where: { id: stopId } });
  if (!stop) return NextResponse.json({ error: "Stop not found" }, { status: 404 });

  const body = Schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request", details: body.error.flatten() },
      { status: 400 },
    );
  }

  // Cancel any existing live arrival for this user — only one active at a time.
  await db.stopArrival.updateMany({
    where: { userId: session.sub, cancelledAt: null, expiresAt: { gt: new Date() } },
    data: { cancelledAt: new Date() },
  });

  const arrival = await db.stopArrival.create({
    data: {
      userId: session.sub,
      stopId,
      destinationStopId: body.data.destinationStopId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.json({ arrival });
}
