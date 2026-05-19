import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const PatchSchema = z.object({
  suspended: z.boolean(),
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

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = await db.user.update({
    where: { id },
    data: { suspendedAt: parsed.data.suspended ? new Date() : null },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      suspendedAt: true,
    },
  });

  return NextResponse.json({
    user: { ...user, suspendedAt: user.suspendedAt?.toISOString() ?? null },
  });
}
