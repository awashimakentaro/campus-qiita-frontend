// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // 一時停止：認証判定は行わず、常に通す
  return NextResponse.next();
}

// すべて対象外にして実質無効化
export const config = {
  matcher: [],
};