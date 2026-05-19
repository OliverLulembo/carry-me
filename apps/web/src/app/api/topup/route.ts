import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { WalletEntryKind } from "@prisma/client";

// Dev-mode top-up. In production this only fires AFTER the PSP webhook confirms payment.
// Here we just credit the wallet immediately and tag the entry so it's easy to filter later.
const Schema = z.object({
  amount: z.number().int().min(10).max(2000),
  method: z
    .enum(["MTN_MOMO", "AIRTEL_MONEY", "ZAMTEL_KWACHA", "ZEDMOBILE_WALLET", "CARD"])
    .default("MTN_MOMO"),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { amount, method } = parsed.data;

  const wallet = await db.wallet.findUnique({ where: { userId: session.sub } });
  if (!wallet) return NextResponse.json({ error: "No wallet" }, { status: 404 });

  const updated = await db.$transaction(async (tx) => {
    const newBalance = wallet.balance + amount;
    await tx.walletEntry.create({
      data: {
        walletId: wallet.id,
        amount,
        kind: WalletEntryKind.TOPUP,
        balanceAfter: newBalance,
        reference: `dev-${method}-${Date.now()}`,
        note: `Top-up via ${method} (dev mode)`,
      },
    });
    return tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
      select: { balance: true },
    });
  });

  return NextResponse.json({ balance: updated.balance, addedCredits: amount });
}
