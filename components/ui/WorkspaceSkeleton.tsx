import Link from "next/link";

/**
 * Shown while a workspace bundle loads.
 *
 * Both workspaces read localStorage during their first render, so they mount
 * client-side only — this is what gets prerendered into the static HTML in
 * their place. It therefore has two jobs at once: tell a person waiting on the
 * bundle what they're waiting for, and be the only copy a client that doesn't
 * run JavaScript will ever see. One piece of text has to be true for both,
 * which is why nothing here is hidden, off-screen, or swapped on hydration —
 * the heading matches the one the mounted app renders.
 *
 * `rails` mirrors the real workspace's geometry. A skeleton whose columns don't
 * match the component it stands in for manufactures the layout shift it exists
 * to prevent.
 */
export function WorkspaceSkeleton({
  title,
  summary,
  points,
  other,
  rails,
}: {
  title: string;
  summary: string;
  points: string[];
  other: { href: string; label: string };
  rails: { left?: number; right: number; mobileTop?: number };
}) {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex h-[53px] shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="size-4 rounded-[5px] bg-raised" />
        <Link href="/" className="text-sm font-medium tracking-tight text-ink-dim">
          themephile
        </Link>
        <span className="mx-1 h-5 w-px bg-line" />
        <span className="text-sm text-ink-faint">{title}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {rails.mobileTop ? (
          <div
            className="shrink-0 border-b border-line lg:hidden"
            style={{ height: rails.mobileTop }}
          />
        ) : null}
        {rails.left ? (
          <div
            className="hidden shrink-0 border-r border-line lg:block"
            style={{ width: rails.left }}
          />
        ) : null}

        <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-10">
          <div className="max-w-md">
            <h1 className="text-xl font-medium tracking-tight">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">{summary}</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-faint">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="label mt-8 animate-pulse">Loading…</p>
            <noscript>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                This tool does all of its work in your browser, so it needs
                JavaScript enabled. Nothing is sent anywhere either way.
              </p>
            </noscript>
            <p className="mt-6 text-xs text-ink-faint">
              <Link href="/" className="underline underline-offset-4 hover:text-ink">
                themephile home
              </Link>
              {" · "}
              <Link
                href={other.href}
                className="underline underline-offset-4 hover:text-ink"
              >
                {other.label}
              </Link>
            </p>
          </div>
        </div>

        <div
          className="hidden shrink-0 border-l border-line lg:block"
          style={{ width: rails.right }}
        />
      </div>
    </div>
  );
}
