import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { loadPassengerWallet } from "@/lib/passenger-wallet";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50)));
  const data = await loadPassengerWallet(session.sub, limit);
  if (!data) return NextResponse.json({ error: "No wallet" }, { status: 404 });

  return NextResponse.json(data);
}
