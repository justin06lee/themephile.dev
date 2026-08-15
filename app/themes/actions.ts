"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { galleryEnabled } from "@/lib/env";
import { ROLE_IDS } from "@/lib/theme/roles";

/**
 * Mutations.
 *
 * A server action is a POST endpoint that anyone can call — the framework
 * checks Origin against Host, and that is all it checks. Rendering the publish
 * dialog only for signed-in people is a UI convenience, not a boundary, so
 * every function below re-establishes who is asking and re-validates
 * everything it was handed.
 */

const HEX = /^#[0-9a-f]{6}$/;
const ROLE_SET = new Set<string>(ROLE_IDS);

export type PublishResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/**
 * Keep only known roles with well-formed values. Unknown keys are dropped
 * rather than rejected: a client one version ahead should still be able to
 * publish, and silently storing whatever it sent is the alternative worth
 * avoiding.
 */
function cleanPalette(input: unknown): Record<string, string> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;

  const colors: Record<string, string> = {};
  for (const [role, value] of Object.entries(input as Record<string, unknown>)) {
    if (!ROLE_SET.has(role) || typeof value !== "string") continue;
    const hex = value.trim().toLowerCase();
    if (HEX.test(hex)) colors[role] = hex;
  }
  return Object.keys(colors).length >= 8 ? colors : null;
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "theme";

export async function publishTheme(input: {
  name: string;
  blurb: string;
  appearance: string;
  colors: unknown;
}): Promise<PublishResult> {
  if (!galleryEnabled) return { ok: false, error: "The gallery isn't configured." };

  const session = await getSession();
  if (!session) return { ok: false, error: "Sign in to publish a theme." };

  const name = String(input.name ?? "").trim().slice(0, 48);
  if (!name) return { ok: false, error: "Give it a name first." };

  const blurb = String(input.blurb ?? "").trim().slice(0, 140);
  const appearance = input.appearance === "light" ? "light" : "dark";

  const colors = cleanPalette(input.colors);
  if (!colors) return { ok: false, error: "That palette didn't look right." };

  const base = slugify(name);

  // Slug allocation is a race by construction: two people publishing "Nord" in
  // the same second both see the name as free. The unique index is the
  // authority, so try, catch the collision, and try again with a suffix.
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randomSuffix()}`;
    try {
      await db().execute({
        sql: `insert into themes (id, author_id, slug, name, blurb, appearance, colors)
              values (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          session.userId,
          slug,
          name,
          blurb || null,
          appearance,
          JSON.stringify(colors),
        ],
      });
      revalidatePath("/themes");
      revalidatePath("/sitemap.xml");
      return { ok: true, slug };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unique/i.test(message)) continue;
      // The quota and palette triggers raise their own wording; it is written
      // to be read by a person, so pass it through rather than flattening it.
      if (/limit of 60|colour|colors must/i.test(message)) {
        return { ok: false, error: message.replace(/^.*?:\s*/, "") };
      }
      return { ok: false, error: "Publishing failed. Try again in a moment." };
    }
  }
  return { ok: false, error: "Couldn't find a free URL for that name — try another." };
}

const randomSuffix = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 4);

/** Returns the resulting state, or null if nothing happened. */
export async function toggleLike(themeId: string): Promise<boolean | null> {
  if (!galleryEnabled) return null;

  const session = await getSession();
  if (!session) return null;
  if (typeof themeId !== "string" || themeId.length > 64) return null;

  try {
    const removed = await db().execute({
      sql: "delete from likes where theme_id = ? and user_id = ?",
      args: [themeId, session.userId],
    });
    if (removed.rowsAffected > 0) return false;

    await db().execute({
      sql: "insert into likes (theme_id, user_id) values (?, ?)",
      args: [themeId, session.userId],
    });
    return true;
  } catch {
    // A foreign-key failure means the theme is gone; a unique failure means a
    // double-click raced itself. Neither is worth an error banner.
    return null;
  }
}

export async function deleteTheme(slug: string): Promise<boolean> {
  if (!galleryEnabled) return false;
  const session = await getSession();
  if (!session) return false;

  try {
    // Likes are removed explicitly rather than by ON DELETE CASCADE: SQLite
    // only enforces foreign keys when `PRAGMA foreign_keys` is on, which is a
    // per-connection setting we do not control over HTTP. A batch runs as one
    // transaction, so this cannot half-happen.
    //
    // The author check lives in the WHERE clause, so a caller that reaches
    // this action directly still cannot delete someone else's theme.
    const result = await db().batch([
      {
        sql: `delete from likes
              where theme_id in (select id from themes where slug = ? and author_id = ?)`,
        args: [slug, session.userId],
      },
      {
        sql: "delete from themes where slug = ? and author_id = ?",
        args: [slug, session.userId],
      },
    ]);
    if (result[1].rowsAffected === 0) return false;
    revalidatePath("/themes");
    return true;
  } catch {
    return false;
  }
}
