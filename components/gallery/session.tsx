"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { galleryEnabled } from "@/lib/supabase/config";

type SessionValue = {
  enabled: boolean;
  user: User | null;
  /** False until we've heard back, so nothing flashes "signed out" first. */
  ready: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Theme ids the signed-in person has liked. Empty when signed out. */
  liked: ReadonlySet<string>;
  /** Resulting liked state, or null if nothing happened (signed out, failed). */
  toggleLike: (themeId: string) => Promise<boolean | null>;
};

const SessionContext = createContext<SessionValue | null>(null);

const NO_LIKES: ReadonlySet<string> = new Set();

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!galleryEnabled);

  /**
   * Likes are stored against the id they were fetched for, so signing out
   * empties them by derivation rather than by an effect that clears state —
   * which would cost an extra render pass and is what React's
   * `set-state-in-effect` rule is warning about.
   */
  const [likedFor, setLikedFor] = useState<{
    userId: string;
    ids: Set<string>;
  } | null>(null);

  const liked = (likedFor?.userId === user?.id ? likedFor?.ids : null) ?? NO_LIKES;

  useEffect(() => {
    if (!galleryEnabled) return;
    const client = supabase();
    let alive = true;

    void client.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUser(data.user ?? null);
      setReady(true);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // One query for every like you've given, rather than one per card. A grid of
  // 24 themes would otherwise open 24 connections to answer the same question.
  useEffect(() => {
    if (!galleryEnabled || !user) return;
    const userId = user.id;
    let alive = true;
    void supabase()
      .from("likes")
      .select("theme_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (alive && data) {
          setLikedFor({ userId, ids: new Set(data.map((r) => r.theme_id)) });
        }
      });
    return () => {
      alive = false;
    };
  }, [user]);

  const signIn = useCallback(async () => {
    if (!galleryEnabled) return;
    await supabase().auth.signInWithOAuth({
      provider: "github",
      // Come back to exactly where they were. The editor's own state survives
      // the round trip through localStorage, not through this URL.
      options: { redirectTo: window.location.href },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!galleryEnabled) return;
    await supabase().auth.signOut();
  }, []);

  const toggleLike = useCallback(
    async (themeId: string): Promise<boolean | null> => {
      if (!galleryEnabled) return null;
      if (!user) {
        // Signing in navigates away; there's nothing to toggle yet.
        await signIn();
        return null;
      }

      const userId = user.id;
      const flip = (id: string) =>
        setLikedFor((prev) => {
          const ids = new Set(prev?.userId === userId ? prev.ids : []);
          if (ids.has(id)) ids.delete(id);
          else ids.add(id);
          return { userId, ids };
        });

      // Optimistic: the round trip is slower than the animation, and the
      // server's answer replaces this either way.
      flip(themeId);

      const { data, error } = await supabase().rpc("toggle_like", {
        p_theme_id: themeId,
      });
      if (error) {
        flip(themeId);
        return null;
      }

      setLikedFor((prev) => {
        const ids = new Set(prev?.userId === userId ? prev.ids : []);
        if (data) ids.add(themeId);
        else ids.delete(themeId);
        return { userId, ids };
      });
      return Boolean(data);
    },
    [user, signIn],
  );

  const value = useMemo<SessionValue>(
    () => ({ enabled: galleryEnabled, user, ready, signIn, signOut, liked, toggleLike }),
    [user, ready, signIn, signOut, liked, toggleLike],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

/** GitHub handle, which is what the profile row is built from. */
export function handleOf(user: User): string {
  const meta = user.user_metadata as Record<string, unknown>;
  return (
    (typeof meta.user_name === "string" && meta.user_name) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username) ||
    (typeof meta.name === "string" && meta.name) ||
    "you"
  );
}

export function avatarOf(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown>;
  return typeof meta.avatar_url === "string" ? meta.avatar_url : null;
}
