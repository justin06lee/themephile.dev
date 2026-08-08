import Link from "next/link";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-tight">
          <span className="size-4 rounded-[5px] bg-gradient-to-br from-[var(--accent)] to-emerald-400" />
          themephile
        </Link>

        <div className="ml-auto flex items-center gap-1 text-[13px]">
          <Link
            href="/editor"
            className="rounded-md px-2.5 py-1.5 text-ink-dim transition-colors hover:bg-raised hover:text-ink"
          >
            Theme editor
          </Link>
          <Link
            href="/tmux"
            className="rounded-md px-2.5 py-1.5 text-ink-dim transition-colors hover:bg-raised hover:text-ink"
          >
            tmux studio
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-ink-faint sm:flex-row sm:items-center">
        <p>
          Everything runs in your browser. No account, no tracking, nothing
          uploaded — your theme lives in the URL and in local storage.
        </p>
        <div className="flex gap-4 sm:ml-auto">
          <Link href="/editor" className="transition-colors hover:text-ink">
            Editor
          </Link>
          <Link href="/tmux" className="transition-colors hover:text-ink">
            tmux
          </Link>
        </div>
      </div>
    </footer>
  );
}
