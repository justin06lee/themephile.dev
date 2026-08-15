import "server-only";
import { createClient, type Client } from "@libsql/client/web";
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL, databaseReady } from "@/lib/env";

/**
 * The `/web` build is pure fetch — no native bindings — which is what makes it
 * safe to run on a serverless function without a platform-specific binary.
 *
 * One client per process. libSQL over HTTP is stateless, so this is a handle
 * rather than a connection pool, and reusing it just avoids re-parsing config.
 */
let client: Client | null = null;

export function db(): Client {
  if (!databaseReady) {
    throw new Error(
      "The gallery needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. See .env.example.",
    );
  }
  client ??= createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });
  return client;
}

/** SQLite returns whatever it stored; narrow it at the boundary. */
export const asText = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));
export const asNumber = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
export const asTextOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;
