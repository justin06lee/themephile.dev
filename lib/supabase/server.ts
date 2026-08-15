import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

/**
 * An anonymous reader for server components. It never carries a session —
 * gallery pages render the same HTML for everyone, which is what lets them be
 * cached and crawled — so there is no cookie handling here at all.
 */
export function supabaseRead(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
