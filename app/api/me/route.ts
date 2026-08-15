import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { likedThemeIds } from "@/lib/gallery/queries";
import { authReady, galleryEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Everything the browser needs to know about *you*, in one request.
 *
 * Gallery pages are cached and identical for everyone — that is what keeps
 * them crawlable and cheap. The per-person part (are you signed in, which
 * themes have you liked) is fetched separately and never cached, so one
 * uncacheable request buys a fully cacheable page.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { enabled: galleryEnabled, canSignIn: authReady, user: null, liked: [] },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      enabled: galleryEnabled,
      canSignIn: authReady,
      // Deliberately narrow: the cookie holds no more than this, and the
      // response should not become a place where user records leak out.
      user: {
        username: session.username,
        avatarUrl: session.avatarUrl,
      },
      liked: await likedThemeIds(session.userId),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
