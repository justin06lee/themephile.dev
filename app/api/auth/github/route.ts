import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/lib/auth/github";
import { authReady } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Where GitHub sends people back. Must match the OAuth App exactly. */
export const callbackUrl = (origin: string) => `${origin}/api/auth/callback`;

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;

  if (!authReady) {
    return NextResponse.redirect(new URL("/themes?auth=unconfigured", origin));
  }

  // Only same-site paths are honoured, so this can't be turned into an open
  // redirect by handing someone a crafted sign-in link.
  const requested = searchParams.get("next") ?? "/themes";
  const next = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/themes";

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(authorizeUrl(state, callbackUrl(origin)));

  // The state is the CSRF defence: it comes back in the query string and has
  // to match a cookie only this browser has. Ten minutes is plenty to click
  // "Authorize" and short enough to be worthless if leaked.
  response.cookies.set("tp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("tp_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
