import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, fetchGitHubUser } from "@/lib/auth/github";
import { seal } from "@/lib/auth/session";
import { upsertUser } from "@/lib/gallery/users";
import { authReady } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * GitHub sends people here with `?code=&state=`. Everything below is a
 * rejection until proven otherwise: an unrecognised `state` means the request
 * did not start in this browser, and there is no reason to be forgiving about
 * it.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/themes?auth=${reason}`, origin));

  if (!authReady) return fail("unconfigured");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expected = request.cookies.get("tp_oauth_state")?.value;
  // Re-validated even though we set this cookie ourselves and it is HttpOnly:
  // `new URL("//evil.com", origin)` is protocol-relative and would leave the
  // site, so the check belongs at the point of use as well as at the source.
  const requested = request.cookies.get("tp_oauth_next")?.value ?? "/themes";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/themes";

  if (!code || !state || !expected || state !== expected) return fail("state");

  const token = await exchangeCode(code, `${origin}/api/auth/callback`);
  if (!token) return fail("exchange");

  const profile = await fetchGitHubUser(token);
  if (!profile) return fail("profile");

  const user = await upsertUser(profile);

  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.set("tp_session", await seal({
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // One-shot cookies; leaving them around would let a stale state be replayed.
  response.cookies.delete("tp_oauth_state");
  response.cookies.delete("tp_oauth_next");

  return response;
}
