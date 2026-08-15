import "server-only";
import { asNumber, asText, asTextOrNull, db } from "@/lib/db/client";
import { galleryEnabled } from "@/lib/env";
import { readPalette, type GalleryTheme } from "./theme";

export type Sort = "top" | "new";

export const SORTS: { id: Sort; label: string }[] = [
  { id: "top", label: "Most liked" },
  { id: "new", label: "Newest" },
];

export const PAGE_SIZE = 24;

const SELECT = `
  select t.id, t.slug, t.name, t.blurb, t.appearance, t.colors,
         t.like_count, t.created_at,
         u.username, u.avatar_url
  from themes t
  join users u on u.id = t.author_id`;

type Row = Record<string, unknown>;

function toGallery(row: Row): GalleryTheme {
  return {
    id: asText(row.id),
    slug: asText(row.slug),
    name: asText(row.name),
    blurb: asTextOrNull(row.blurb),
    appearance: asText(row.appearance) === "light" ? "light" : "dark",
    // SQLite has no JSON type — the column is text, parsed here and validated
    // role by role, so a malformed row degrades to defaults instead of
    // throwing on render.
    colors: readPalette(safeParse(asText(row.colors))),
    likeCount: asNumber(row.like_count),
    createdAt: asText(row.created_at),
    author: {
      username: asText(row.username),
      avatarUrl: asTextOrNull(row.avatar_url),
    },
  };
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function listThemes(options: {
  sort?: Sort;
  appearance?: "dark" | "light";
  query?: string;
  /** GitHub handle, for "your themes". */
  author?: string;
  page?: number;
}): Promise<{ themes: GalleryTheme[]; hasMore: boolean }> {
  if (!galleryEnabled) return { themes: [], hasMore: false };

  const page = Math.max(0, options.page ?? 0);
  const where: string[] = [];
  const args: (string | number)[] = [];

  if (options.appearance) {
    where.push("t.appearance = ?");
    args.push(options.appearance);
  }
  if (options.query?.trim()) {
    // LIKE is case-insensitive for ASCII in SQLite, which is what people
    // expect from a search box. Parameterised, so the wildcards are data.
    where.push("t.name like ?");
    args.push(`%${options.query.trim()}%`);
  }
  if (options.author?.trim()) {
    where.push("u.username = ?");
    args.push(options.author.trim());
  }

  const order =
    options.sort === "new"
      ? "order by t.created_at desc"
      : "order by t.like_count desc, t.created_at desc";

  // One extra row is cheaper than a second count query, and "is there a next
  // page" is the only thing the UI needs to know.
  args.push(PAGE_SIZE + 1, page * PAGE_SIZE);

  try {
    const result = await db().execute({
      sql: `${SELECT}
            ${where.length ? `where ${where.join(" and ")}` : ""}
            ${order}
            limit ? offset ?`,
      args,
    });
    const rows = result.rows as unknown as Row[];
    return {
      themes: rows.slice(0, PAGE_SIZE).map(toGallery),
      hasMore: rows.length > PAGE_SIZE,
    };
  } catch {
    return { themes: [], hasMore: false };
  }
}

export async function getTheme(slug: string): Promise<GalleryTheme | null> {
  if (!galleryEnabled) return null;
  try {
    const result = await db().execute({
      sql: `${SELECT} where t.slug = ? limit 1`,
      args: [slug],
    });
    const row = result.rows[0] as unknown as Row | undefined;
    return row ? toGallery(row) : null;
  } catch {
    return null;
  }
}

/** Sitemap and prerendering. Newest first, capped — sitemaps have limits. */
export async function listAllSlugs(
  limit = 2000,
): Promise<{ slug: string; updatedAt: string }[]> {
  if (!galleryEnabled) return [];
  try {
    const result = await db().execute({
      sql: "select slug, updated_at from themes order by created_at desc limit ?",
      args: [limit],
    });
    return (result.rows as unknown as Row[]).map((row) => ({
      slug: asText(row.slug),
      updatedAt: asText(row.updated_at),
    }));
  } catch {
    return [];
  }
}

export async function countThemes(): Promise<number> {
  if (!galleryEnabled) return 0;
  try {
    const result = await db().execute("select count(*) as n from themes");
    return asNumber((result.rows[0] as unknown as Row).n);
  } catch {
    return 0;
  }
}

/** Every theme this person has liked, for /api/me. */
export async function likedThemeIds(userId: string): Promise<string[]> {
  if (!galleryEnabled) return [];
  try {
    const result = await db().execute({
      sql: "select theme_id from likes where user_id = ?",
      args: [userId],
    });
    return (result.rows as unknown as Row[]).map((row) => asText(row.theme_id));
  } catch {
    return [];
  }
}
