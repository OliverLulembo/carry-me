import { NextResponse, type NextRequest } from "next/server";
import { applyCors, preflight } from "@/lib/cors";

export function middleware(req: NextRequest) {
  // Only the API surface needs CORS; web pages render on the same origin.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const pre = preflight(req);
    if (pre) return pre;
    const res = NextResponse.next();
    return applyCors(req, res);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
