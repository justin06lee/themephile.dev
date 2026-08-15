"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toggleLike as toggleLikeAction } from "@/app/themes/actions";

/**
 * Who you are, and what you've liked.
 *
 * Gallery pages are cached and render identically for everyone — that's what
 * keeps them crawlable and cheap. Everything person-shaped is fetched here in
 * one uncached request after hydration, so a page can be fully static and
 * still show your likes.
 *
 * The session cookie itself is HttpOnly and never readable from JavaScript;
 * this only ever holds what /api/me chooses to reveal.
 */

type Me = {
  enabled: boolean;
  canSignIn: boolean;
  user: { username: string; avatarUrl: string | null } | null;
  liked: string[];
};

type SessionValue = {
  enabled: boolean;
  canSignIn: boolean;
  user: Me["user"];
  /** False until /api/me answers, so nothing flashes "signed out" first. */
  ready: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  liked: ReadonlySet<string>;
  /** Resulting liked state, or null if nothing happened. */
  toggleLike: (themeId: string) => Promise<boolean | null>;
};

const SessionContext = createContext<SessionValue | null>(null);

const NO_LIKES: ReadonlySet<string> = new Set();

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    void fetch("/api/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Me | null) => {
        if (alive && data) setMe(data);
      })
      .catch(() => {
        // A gallery that can't reach its own API should still let you use the
        // editor; failing quiet is the right call for an optional feature.
      });
    return () => {
      alive = false;
    };
  }, []);

  const liked = useMemo<ReadonlySet<string>>(
    () => (me?.liked ? new Set(me.liked) : NO_LIKES),
    [me],
  );

  const signIn = useCallback(() => {
    const next = window.location.pathname + window.location.search;
    // A full navigation is required, not router.push: this path is a route
    // handler whose whole job is to 302 to github.com, and the client router
    // cannot follow a redirect off-origin.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/github?next=${encodeURIComponent(next)}`;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    // A full reload rather than a state flip: every cached page fragment on
    // screen was rendered for the signed-in view.
    window.location.reload();
  }, []);

  const toggleLike = useCallback(
    async (themeId: string): Promise<boolean | null> => {
      if (!me?.enabled) return null;
      if (!me.user) {
        signIn();
        return null;
      }

      const flip = (add: boolean) =>
        setMe((prev) =>
          prev
            ? {
                ...prev,
                liked: add
                  ? [...new Set([...prev.liked, themeId])]
                  : prev.liked.filter((id) => id !== themeId),
              }
            : prev,
        );

      const wanted = !liked.has(themeId);
      flip(wanted); // optimistic

      const result = await new Promise<boolean | null>((resolve) => {
        startTransition(async () => {
          resolve(await toggleLikeAction(themeId));
        });
      });

      if (result === null) {
        flip(!wanted); // undo
        return null;
      }
      flip(result);
      return result;
    },
    [me, liked, signIn],
  );

  const value = useMemo<SessionValue>(
    () => ({
      enabled: me?.enabled ?? false,
      canSignIn: me?.canSignIn ?? false,
      user: me?.user ?? null,
      ready: me !== null,
      signIn,
      signOut,
      liked,
      toggleLike,
    }),
    [me, liked, signIn, signOut, toggleLike],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
