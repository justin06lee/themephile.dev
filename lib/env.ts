import "server-only";

/**
 * Server-side configuration. Nothing here is `NEXT_PUBLIC_`, and that is the
 * point: with Turso the database credential is a real secret, so the browser
 * never talks to the database at all. Every read and write goes through a
 * route handler or a server action, which is also where authorisation is
 * enforced.
 */

export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "";
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

/**
 * The two capabilities are separate on purpose. A database without OAuth still
 * gives a fully working, browsable, crawlable gallery — it just can't take new
 * themes. That's a better failure than hiding the whole feature, and it means
 * the site degrades one step at a time instead of all at once.
 */
export const databaseReady = Boolean(TURSO_DATABASE_URL && TURSO_AUTH_TOKEN);

export const authReady = Boolean(
  GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && SESSION_SECRET.length >= 32,
);

export const galleryEnabled = databaseReady;
