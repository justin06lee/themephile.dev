import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * One group, allow everything, point at the sitemap.
 *
 * Deliberately no AI-crawler rules. GPTBot, ClaudeBot, PerplexityBot, CCBot,
 * Google-Extended and friends are opt-OUT controls — they only ever appear as
 * `Disallow`, and their absence already means allowed. themephile is a free,
 * open-source tool whose distribution depends on being cited, so the correct
 * directive is none at all.
 *
 * A redundant per-agent `Allow` block would be worse than nothing: robots.txt
 * selects the single most specific User-Agent group and does not merge it with
 * `*`, so any rule later added to `*` would silently fail to apply to every
 * agent that had been given its own block.
 *
 * And never `Disallow: /_next/` — both tool routes are entirely JS-rendered, so
 * blocking the chunks would leave Google's renderer looking at the skeleton
 * forever.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
