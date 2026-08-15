"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, galleryEnabled } from "./config";
import type { Database } from "./database.types";

/**
 * The browser client, and the only place a session exists.
 *
 * Auth is deliberately client-only. The gallery pages are public content and
 * render identically for everyone, so they stay statically cacheable and fully
 * crawlable; the only per-person state — whether *you* liked this — hydrates
 * afterwards. That also means no proxy/middleware hop on every request, and no
 * auth cookie for a page that doesn't need one.
 */
let client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (!galleryEnabled) {
    throw new Error(
      "The gallery needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See .env.example.",
    );
  }
  client ??= createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      // PKCE keeps the token out of the URL fragment, which matters here
      // because the editor already uses the fragment for the theme itself.
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
