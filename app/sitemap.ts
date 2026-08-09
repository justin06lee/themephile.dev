import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Three static routes, three absolute URLs.
 *
 * No `lastModified`: this is a build-time-cached route handler, so `new Date()`
 * would evaluate once per deploy and stamp all three entries with an identical
 * timestamp unrelated to whether any page actually changed. Google honours
 * `<lastmod>` only while it stays verifiably accurate and discards it site-wide
 * once it doesn't, so omitting beats fabricating.
 *
 * No `changeFrequency`: it is a claim about the future that Google ignores.
 *
 * `priority` stays because, unlike the other two, it states this site's fixed
 * internal hierarchy and cannot become false.
 *
 * The root has no trailing slash: verified against the built output, Next emits
 * `rel="canonical" href="https://themephile.dev"` for the layout's `"/"`, and a
 * sitemap that disagreed with the canonical would be asserting two URLs for one
 * page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/editor`, priority: 0.9 },
    { url: `${SITE_URL}/tmux`, priority: 0.8 },
  ];
}
