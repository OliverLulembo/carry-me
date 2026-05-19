import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// Linked passenger devices — phones (Android HCE), NFC cards, and wristbands.
// Used by the mobile BalanceCard's "Linked devices" panel so the dashboard
// reflects the same multi-device list that the web app already shows.
// DRIVER_PAD devices are excluded: they belong to a bus, not a passenger.
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await db.device.findMany({
    where: {
      userId: session.sub,
      type: { in: ["PHONE", "CARD", "WRISTBAND"] },
    },
    orderBy: [
      { active: "desc" },
      { lastSeenAt: "desc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      type: true,
      label: true,
      active: true,
      lastSeenAt: true,
    },
  });

  return NextResponse.json({
    devices: devices.map((d) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      active: d.active,
      lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
    })),
  });
}
