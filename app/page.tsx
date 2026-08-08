import Link from "next/link";
import { HeroPreview } from "@/components/site/HeroPreview";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { TmuxStatusBar } from "@/components/tmux/TmuxStatusBar";
import { TARGETS } from "@/lib/export";
import { PRESETS } from "@/lib/theme/presets";
import { ROLE_IDS } from "@/lib/theme/roles";
import { defaultTmuxConfig } from "@/lib/tmux/config";

const tmuxDemo = defaultTmuxConfig(PRESETS[0]);

const FEATURES = [
  {
    title: "Click the code, not a list",
    body: "Every token in the preview is a hit target. Click a keyword, change the keyword color. Selecting a role lights up everywhere it appears.",
  },
  {
    title: "Colors that behave",
    body: "Palettes are generated in OKLCh, so “a bit lighter” means the same thing on yellow as on blue. Shuffle gives you a coherent theme, not confetti.",
  },
  {
    title: "Contrast you can defend",
    body: "Live WCAG ratios for every role against the canvas, and one button that lifts the failing ones without touching their hue.",
  },
  {
    title: "Nothing leaves the tab",
    body: "No account, no upload, no analytics. Your theme lives in the URL fragment and in local storage — share a link and the whole palette rides along.",
  },
];

export default function Home() {
  return (
    <>
      <SiteNav />

      <main className="flex-1">
        {/* hero */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="dotfield pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-14 sm:pt-24">
            <div className="animate-rise mx-auto max-w-2xl text-center">
              <p className="label mb-5">No account · Nothing uploaded · Just colors</p>
              <h1 className="text-balance text-4xl leading-[1.05] font-medium tracking-tight sm:text-6xl">
                Build the theme you
                <br className="hidden sm:block" /> actually want to look at.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-ink-dim">
                A visual editor for syntax colors. Tune all {ROLE_IDS.length} roles
                against real code, then copy a finished config for VS Code, Neovim,
                Vim, Emacs, tmux, or your terminal.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                <Link href="/editor" className="btn btn-primary px-4 py-2.5 text-sm">
                  Open the theme editor
                </Link>
                <Link href="/tmux" className="btn px-4 py-2.5 text-sm">
                  tmux studio
                </Link>
              </div>
            </div>

            <div className="animate-rise mt-14 [animation-delay:120ms]">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* two tools */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="label">Two tools</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Link
              href="/editor"
              className="panel group flex flex-col overflow-hidden transition-colors hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--color-line))]"
            >
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg font-medium tracking-tight">Theme editor</h3>
                <p className="text-sm leading-relaxed text-ink-dim">
                  Six languages of live preview, a full editor mock-up with tabs and
                  a status line, an ANSI terminal, and one-click export to ten
                  targets.
                </p>
                <span className="mt-3 font-mono text-[11px] text-ink-faint transition-colors group-hover:text-[var(--accent)]">
                  Open editor →
                </span>
              </div>
              <div className="grid grid-cols-8">
                {PRESETS.slice(0, 4).flatMap((p) =>
                  (["keyword", "string"] as const).map((role) => (
                    <span
                      key={`${p.name}-${role}`}
                      className="h-1.5"
                      style={{ background: p.colors[role] }}
                    />
                  )),
                )}
              </div>
            </Link>

            <Link
              href="/tmux"
              className="panel group flex flex-col overflow-hidden transition-colors hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--color-line))]"
            >
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg font-medium tracking-tight">tmux studio</h3>
                <p className="text-sm leading-relaxed text-ink-dim">
                  Drag your status bar into shape — segments, powerline separators,
                  pane borders, prefix key — and watch a live terminal redraw as you
                  go. Out comes a complete <code className="font-mono">.tmux.conf</code>.
                </p>
                <span className="mt-3 font-mono text-[11px] text-ink-faint transition-colors group-hover:text-[var(--accent)]">
                  Open tmux studio →
                </span>
              </div>
              <div className="border-t border-line">
                <TmuxStatusBar config={tmuxDemo} fontSize={11} />
              </div>
            </Link>
          </div>
        </section>

        {/* targets */}
        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-12">
            <h2 className="label">Exports to</h2>
            <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {TARGETS.map((t) => (
                <li key={t.id} className="text-lg font-medium tracking-tight text-ink-dim">
                  {t.label}
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-faint">
              Not a color list — a real config. Workbench chrome and semantic tokens
              for VS Code, treesitter and LSP groups for Neovim, cterm fallbacks for
              Vim, font-lock and org faces for Emacs, with install steps for each.
            </p>
          </div>
        </section>

        {/* features */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="flex gap-4">
                <span className="mt-1 font-mono text-[11px] text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* closing */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-balance text-2xl font-medium tracking-tight sm:text-3xl">
              Your editor, in your colors, in about five minutes.
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link href="/editor" className="btn btn-primary px-4 py-2.5 text-sm">
                Start with a preset
              </Link>
              <Link href="/tmux" className="btn px-4 py-2.5 text-sm">
                Configure tmux
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
