/**
 * Single source of truth for the production origin and the shared social-card
 * fields.
 *
 * `app/sitemap.ts` and `app/robots.ts` compile as standalone route handlers and
 * cannot see the `metadataBase` exported from `app/layout.tsx` — Next writes
 * `item.url` verbatim into `<loc>` with no base resolution (see
 * `next/dist/build/webpack/loaders/metadata/resolve-route-data.js`, which says
 * so in a comment). So every absolute URL the site publishes has to agree by
 * construction rather than by convention.
 *
 * Not an env var on purpose: a missing `NEXT_PUBLIC_*` at build time would
 * silently ship `undefined/editor` into a production sitemap, which is strictly
 * worse than a literal.
 */
export const SITE_URL = "https://themephile.dev";

export const REPO_URL = "https://github.com/justin06lee/themephile.dev";
export const LICENSE_URL = `${REPO_URL}/blob/HEAD/LICENSE`;
export const AUTHOR_URL = "https://github.com/justin06lee";

/**
 * Setting `openGraph` on a page **replaces** the whole object inherited from
 * the layout — it does not merge field by field (Next's metadata docs state
 * this explicitly). Any page that overrides the title therefore has to spread
 * these back in, or it silently drops `siteName` and `type`.
 */
export const openGraphBase = {
  type: "website",
  siteName: "themephile",
  locale: "en_US",
} as const;
