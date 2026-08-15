import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST only. A signout reachable by GET is a signout any image tag on any site
 * can trigger, which is a nuisance attack rather than a serious one, but it
 * costs nothing to close.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("tp_session");
  void request;
  return response;
}
