import { NextResponse, type NextRequest } from "next/server";
import { WalletEntryKind, WithdrawalStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/owner";

const MIN_WITHDRAWAL = 50;

const CreateSchema = z.object({
  amount: z.number().int().min(MIN_WITHDRAWAL),
  method: z.enum(["BANK", "MTN_MOMO", "AIRTEL_MONEY", "ZAMTEL_KWACHA"]),
  destination: z.string().min(6).max(64),
});

function maskDestination(destination: string): string {
  const trimmed = destination.trim();
  if (trimmed.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const withdrawals = await db.withdrawal.findMany({
    where: { ownerId: auth.session.sub },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount,
      method: w.method,
      destination: w.destination,
      status: w.status,
      feeCredits: w.feeCredits,
      requestedAt: w.requestedAt.toISOString(),
      paidAt: w.paidAt?.toISOString() ?? null,
      reference: w.reference,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, method, destination } = parsed.data;
  const masked = maskDestination(destination);

  const wallet = await db.wallet.findUnique({ where: { userId: auth.session.sub } });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  if (wallet.balance < amount) {
    return NextResponse.json(
      {
        error: `Insufficient balance. You have ${wallet.balance} credits available.`,
        code: "INSUFFICIENT_BALANCE",
      },
      { status: 402 },
    );
  }

  const pending = await db.withdrawal.aggregate({
    where: {
      ownerId: auth.session.sub,
      status: { in: ["REQUESTED", "PROCESSING"] },
    },
    _sum: { amount: true },
  });
  const pendingTotal = pending._sum.amount ?? 0;
  if (wallet.balance - pendingTotal < amount) {
    return NextResponse.json(
      {
        error: "Some credits are already reserved for pending withdrawals.",
        code: "PENDING_WITHDRAWALS",
      },
      { status: 409 },
    );
  }

  const isDev = process.env.NODE_ENV !== "production";
  const reference = `wd-${Date.now()}`;

  const result = await db.$transaction(async (tx) => {
    const newBalance = wallet.balance - amount;
    await tx.walletEntry.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        kind: WalletEntryKind.WITHDRAWAL_OUT,
        balanceAfter: newBalance,
        reference,
        note: `Withdrawal to ${method} (${masked})`,
      },
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const withdrawal = await tx.withdrawal.create({
      data: {
        ownerId: auth.session.sub,
        amount,
        method,
        destination: masked,
        status: isDev ? WithdrawalStatus.PROCESSING : WithdrawalStatus.REQUESTED,
        reference,
        feeCredits: 0,
      },
    });

    return { withdrawal, balance: newBalance };
  });

  return NextResponse.json({
    withdrawal: {
      id: result.withdrawal.id,
      amount: result.withdrawal.amount,
      method: result.withdrawal.method,
      destination: result.withdrawal.destination,
      status: result.withdrawal.status,
      requestedAt: result.withdrawal.requestedAt.toISOString(),
      reference: result.withdrawal.reference,
    },
    balance: result.balance,
  });
}
