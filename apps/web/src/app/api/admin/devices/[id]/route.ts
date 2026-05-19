import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const PatchSchema = z.object({
  active: z.boolean().optional(),
  label: z.string().max(80).nullable().optional(),
  userId: z.string().nullable().optional(),
  busId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.device.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Device not found" }, { status: 404 });

  const device = await db.device.update({
    where: { id },
    data: parsed.data,
    include: {
      user: { select: { id: true, fullName: true, phone: true } },
      bus: { select: { id: true, plate: true } },
    },
  });

  return NextResponse.json({ device });
}
