import { galleryEnabled } from "@/lib/supabase/config";
import { supabaseRead } from "@/lib/supabase/server";
import { readPalette, type GalleryTheme } from "./theme";

export type Sort = "top" | "new";

export const SORTS: { id: Sort; label: string }[] = [
  { id: "top", label: "Most liked" },
  { id: "new", label: "Newest" },
];

export const PAGE_SIZE = 24;

/**
 * The author is embedded through the foreign key rather than fetched
 * separately — one round trip, and PostgREST applies the same RLS to the
 * joined rows.
 */
const SELECT =
  "id,slug,name,blurb,appearance,colors,like_count,created_at,profiles!themes_author_id_fkey!inner(username,avatar_url)";

type Row = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  appearance: string;
  colors: unknown;
  like_count: number;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

function toGallery(row: Row): GalleryTheme {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    blurb: row.blurb,
    appearance: row.appearance === "light" ? "light" : "dark",
    colors: readPalette(row.colors as never),
    likeCount: row.like_count,
    createdAt: row.created_at,
    author: {
      username: row.profiles?.username ?? "someone",
      avatarUrl: row.profiles?.avatar_url ?? null,
    },
  };
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
  const from = page * PAGE_SIZE;

  let q = supabaseRead().from("themes").select(SELECT);

  if (options.appearance) q = q.eq("appearance", options.appearance);
  if (options.query?.trim()) q = q.ilike("name", `%${options.query.trim()}%`);
  // Filtering on the embedded profile: PostgREST turns this into a join
  // predicate, which is why the embed is declared `!inner` at the call.
  if (options.author?.trim()) {
    q = q.eq("profiles.username", options.author.trim());
  }

  q =
    options.sort === "new"
      ? q.order("created_at", { ascending: false })
      : q
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false });

  // One extra row is cheaper than an exact count, and "is there a next page"
  // is the only thing the UI actually needs to know.
  const { data, error } = await q.range(from, from + PAGE_SIZE);
  if (error || !data) return { themes: [], hasMore: false };

  const rows = data as unknown as Row[];
  return {
    themes: rows.slice(0, PAGE_SIZE).map(toGallery),
    hasMore: rows.length > PAGE_SIZE,
  };
}

export async function getTheme(slug: string): Promise<GalleryTheme | null> {
  if (!galleryEnabled) return null;
  const { data, error } = await supabaseRead()
    .from("themes")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return toGallery(data as unknown as Row);
}

/** Sitemap and prerendering. Newest first, capped — sitemaps have limits. */
export async function listAllSlugs(
  limit = 2000,
): Promise<{ slug: string; updatedAt: string }[]> {
  if (!galleryEnabled) return [];
  const { data, error } = await supabaseRead()
    .from("themes")
    .select("slug,updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}

export async function countThemes(): Promise<number> {
  if (!galleryEnabled) return 0;
  const { count } = await supabaseRead()
    .from("themes")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
