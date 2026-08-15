"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "./session";

/**
 * The only place on the site that mentions signing in. It appears on the
 * gallery and next to Publish — never in the editor's way, because editing,
 * exporting and sharing have nothing to do with having an account.
 */
export function AuthButton() {
  const { enabled, canSignIn, ready, user, signIn, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!enabled) return null;

  // Reserve the space rather than popping a button in after hydration.
  if (!ready) return <span className="h-7 w-24 rounded-md bg-raised/50" aria-hidden />;

  // Sign-in is hidden rather than broken when no OAuth app is configured:
  // a button that can only fail is worse than no button.
  if (!user) {
    if (!canSignIn) return null;
    return (
      <button className="btn text-xs" onClick={signIn}>
        <GitHubMark />
        Sign in
      </button>
    );
  }

  const handle = user.username;
  const avatar = user.avatarUrl;

  return (
    <div ref={ref} className="relative">
      <button
        className="btn text-xs"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {avatar ? (
          <Image src={avatar} alt="" width={16} height={16} className="rounded-full" unoptimized />
        ) : (
          <GitHubMark />
        )}
        <span className="max-w-24 truncate">{handle}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="panel animate-fade absolute right-0 z-40 mt-1.5 w-44 overflow-hidden p-1 shadow-2xl"
        >
          <Link
            href={`/themes?by=${encodeURIComponent(handle)}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2.5 py-1.5 text-[13px] text-ink-dim transition-colors hover:bg-raised hover:text-ink"
          >
            Your themes
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-dim transition-colors hover:bg-raised hover:text-ink"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
