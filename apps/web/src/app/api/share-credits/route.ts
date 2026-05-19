import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { ShareStatus, WalletEntryKind } from "@prisma/client";

const Schema = z.object({
  recipientPhone: z.string().min(7).max(20),
  amount: z.number().int().min(1).max(500), // matches PRD default daily share cap
  note: z.string().max(140).optional(),
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
  const { recipientPhone, amount, note } = parsed.data;

  if (recipientPhone === session.phone) {
    return NextResponse.json({ error: "Cannot share credits to yourself" }, { status: 400 });
  }

  const senderWallet = await db.wallet.findUnique({ where: { userId: session.sub } });
  if (!senderWallet) return NextResponse.json({ error: "No wallet" }, { status: 404 });
  if (senderWallet.balance < amount) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
  }

  const recipient = await db.user.findUnique({ where: { phone: recipientPhone } });
  const recipientWallet = recipient
    ? await db.wallet.findUnique({ where: { userId: recipient.id } })
    : null;

  const result = await db.$transaction(async (tx) => {
    // Debit the sender
    const newSenderBalance = senderWallet.balance - amount;
    await tx.walletEntry.create({
      data: {
        walletId: senderWallet.id,
        amount: -amount,
        kind: WalletEntryKind.SHARE_OUT,
        balanceAfter: newSenderBalance,
        reference: recipientPhone,
        note: note ?? `Shared to ${recipientPhone}`,
      },
    });
    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: { balance: newSenderBalance },
    });

    // Credit recipient if they exist, otherwise hold as pending
    if (recipient && recipientWallet) {
      const newRecipientBalance = recipientWallet.balance + amount;
      await tx.walletEntry.create({
        data: {
          walletId: recipientWallet.id,
          amount,
          kind: WalletEntryKind.SHARE_IN,
          balanceAfter: newRecipientBalance,
          reference: session.phone,
          note: note ?? `From ${session.phone}`,
        },
      });
      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: newRecipientBalance },
      });
    }

    return tx.creditShare.create({
      data: {
        senderId: session.sub,
        recipientId: recipient?.id ?? null,
        recipientPhone,
        amount,
        note,
        status: recipient ? ShareStatus.COMPLETED : ShareStatus.PENDING_SIGNUP,
        resolvedAt: recipient ? new Date() : null,
      },
    });
  });

  return NextResponse.json({
    share: result,
    balance: senderWallet.balance - amount,
  });
}
