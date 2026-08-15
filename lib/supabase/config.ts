/**
 * The gallery is the one part of themephile with a backend, and it is
 * optional on purpose: someone cloning the repo to hack on the editor
 * shouldn't have to provision a database first. When these are unset the
 * gallery routes render an honest "not configured" state and everything else
 * works exactly as before.
 *
 * Both values are safe in the browser. Every table is behind row-level
 * security *and* column-level grants, so this key can do precisely what an
 * anonymous visitor is allowed to do and nothing else.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const galleryEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
