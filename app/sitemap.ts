import type { MetadataRoute } from "next";
import { listAllSlugs } from "@/lib/gallery/queries";
import { SITE_URL } from "@/lib/site";

/**
 * Three fixed routes plus every published theme.
 *
 * The fixed entries carry no `lastModified`: this route is cached, so
 * `new Date()` would evaluate once per deploy and stamp all three with an
 * identical timestamp unrelated to whether any page changed. Google honours
 * `<lastmod>` only while it stays verifiably accurate and discards it site-wide
 * once it doesn't, so omitting beats fabricating.
 *
 * Theme pages are the opposite case: `updated_at` is a real, per-row fact
 * maintained by a database trigger, so it earns its `<lastmod>`.
 *
 * No `changeFrequency`: it is a claim about the future that Google ignores.
 * `priority` stays because it states this site's fixed internal hierarchy and
 * cannot become false.
 *
 * The root has no trailing slash: verified against the built output, Next emits
 * `rel="canonical" href="https://themephile.dev"` for the layout's `"/"`, and a
 * sitemap that disagreed with the canonical would assert two URLs for one page.
 *
 * Gotcha worth knowing: because `revalidate` makes this a cached route, a build
 * that runs against a warm `.next/cache` will reuse the previous body rather
 * than re-query. A deploy inside the window can therefore ship a sitemap that
 * predates the newest themes. It self-heals on the next revalidation, and
 * `rm -rf .next` forces it immediately when you need to check the real output.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const themes = await listAllSlugs();

  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/editor`, priority: 0.9 },
    { url: `${SITE_URL}/tmux`, priority: 0.8 },
    { url: `${SITE_URL}/themes`, priority: 0.8 },
    ...themes.map(({ slug, updatedAt }) => ({
      url: `${SITE_URL}/themes/${slug}`,
      lastModified: new Date(updatedAt),
      priority: 0.6,
    })),
  ];
}
