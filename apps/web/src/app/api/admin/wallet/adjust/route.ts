import { NextResponse, type NextRequest } from "next/server";
import { WalletEntryKind } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const Schema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  kind: z.enum(["REFUND", "ADJUSTMENT"]),
  note: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId, amount, kind, note } = parsed.data;
  let wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId, balance: 0 } });
  }

  const newBalance = wallet.balance + amount;
  if (newBalance < 0) {
    return NextResponse.json(
      { error: "Adjustment would make balance negative", balance: wallet.balance },
      { status: 400 },
    );
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.walletEntry.create({
      data: {
        walletId: wallet!.id,
        amount,
        kind: kind as WalletEntryKind,
        balanceAfter: newBalance,
        reference: `admin-${auth.session.sub}`,
        note: `[Admin] ${note}`,
      },
    });
    return tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: newBalance },
      select: { balance: true },
    });
  });

  return NextResponse.json({ balance: updated.balance, amount });
}
