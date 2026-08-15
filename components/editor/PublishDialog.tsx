"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnsiStrip, MiniPreview } from "@/components/gallery/MiniPreview";
import { useSession } from "@/components/gallery/session";
import { publishTheme } from "@/app/themes/actions";
import { writePalette } from "@/lib/gallery/theme";
import { ANSI_ORDER } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

/**
 * The only sign-in prompt in the editor, and it only appears once you've asked
 * to publish. Everything else here — editing, exporting, sharing a link — works
 * signed out and always will.
 */
export function PublishDialog({
  theme,
  open,
  onClose,
}: {
  theme: Theme;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { enabled, canSignIn, ready, user, signIn } = useSession();

  const [name, setName] = useState(theme.name);
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  const publish = async () => {
    setBusy(true);
    setError(null);

    // The action re-checks the session and re-validates every field. This call
    // is a convenience, not the security boundary.
    const result = await publishTheme({
      name: name.trim().slice(0, 48),
      blurb: blurb.trim().slice(0, 140),
      appearance: theme.appearance,
      colors: writePalette(theme),
    });

    if (!result.ok) {
      // The database's own wording is written to be read by a person —
      // "you've hit 60 themes" is actionable where "error" isn't.
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/themes/${result.slug}`);
  };

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Publish to the gallery"
        className="panel flex w-full max-w-lg flex-col overflow-hidden shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">Publish to the gallery</h2>
            <p className="label mt-1">Anyone can open it, edit it, and export it</p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="btn btn-ghost ml-auto shrink-0 px-2"
            aria-label="Close publish dialog"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className="overflow-hidden border-b border-line">
          <MiniPreview colors={theme.colors} rows={6} />
          <AnsiStrip colors={theme.colors} order={ANSI_ORDER} />
        </div>

        {!enabled ? (
          <Body>
            The gallery isn&rsquo;t configured in this build — there&rsquo;s no
            database to publish to. Everything else works; see{" "}
            <code className="rounded bg-raised px-1 py-0.5 font-mono text-[11px]">
              .env.example
            </code>
            .
          </Body>
        ) : !ready ? (
          <Body>Checking whether you&rsquo;re signed in…</Body>
        ) : !user ? (
          <>
            <Body>
              {canSignIn ? (
                <>
                  Publishing needs a name to attach the theme to, so this is the
                  one place themephile asks you to sign in. Browsing, editing,
                  exporting and sharing never will.
                </>
              ) : (
                <>
                  This build has a gallery to read but no GitHub app configured,
                  so there&rsquo;s no way to sign in yet. Your theme is safe —
                  it&rsquo;s in this tab and in the share link.
                </>
              )}
            </Body>
            <Footer>
              <button className="btn text-xs" onClick={onClose}>
                Cancel
              </button>
              {canSignIn && (
                <button className="btn btn-primary text-xs" onClick={signIn}>
                  Sign in with GitHub
                </button>
              )}
            </Footer>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 p-4">
              <label className="flex flex-col gap-1.5">
                <span className="label">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={48}
                  className="rounded-md border border-line bg-sunken px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="label">One line about it (optional)</span>
                <input
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  maxLength={140}
                  placeholder="Muted greens, high contrast, easy at 2am"
                  className="rounded-md border border-line bg-sunken px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--accent)]"
                />
              </label>

              <p className="text-xs leading-relaxed text-ink-faint">
                Publishing as <strong className="font-medium text-ink">{user.username}</strong>
                {" "}· {theme.appearance} · all 48 roles. You can delete it later.
              </p>

              {error && <p className="text-xs leading-relaxed text-amber-300">{error}</p>}
            </div>

            <Footer>
              <button className="btn text-xs" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button
                className="btn btn-primary text-xs"
                onClick={() => void publish()}
                disabled={busy || !name.trim()}
                style={busy || !name.trim() ? { opacity: 0.5, cursor: "default" } : undefined}
              >
                {busy ? "Publishing…" : "Publish"}
              </button>
            </Footer>
          </>
        )}
      </div>
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="p-4 text-xs leading-relaxed text-ink-dim">{children}</p>;
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3">
      {children}
    </footer>
  );
}
