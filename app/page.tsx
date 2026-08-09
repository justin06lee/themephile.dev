import Link from "next/link";
import { HeroPreview } from "@/components/site/HeroPreview";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { TmuxStatusBar } from "@/components/tmux/TmuxStatusBar";
import { TARGETS } from "@/lib/export";
import { PRESET_SEEDS, PRESETS } from "@/lib/theme/presets";
import { ROLE_IDS } from "@/lib/theme/roles";
import { REPO_URL } from "@/lib/site";
import { defaultTmuxConfig } from "@/lib/tmux/config";

const tmuxDemo = defaultTmuxConfig(PRESETS[0]);

const FEATURES = [
  {
    title: "Five previews, one theme",
    body: "VS Code, Neovim, Vim, Emacs, and a terminal — each drawn as itself, down to Neovim's sign column, Vim's ~ filler, and Emacs' boxed modeline. Judge the theme where you'll actually read it.",
  },
  {
    title: "Click the code, not a list",
    body: "Every token in the preview is a hit target — and so is every piece of chrome. Click a keyword, change the keyword color. Selecting a role lights up everywhere it appears.",
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
  {
    title: "Real configs, not color lists",
    body: "Workbench chrome and semantic tokens for VS Code, treesitter and LSP groups for Neovim, cterm fallbacks for Vim, font-lock and org faces for Emacs — each with install steps.",
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
                Build the editor theme you
                <br className="hidden sm:block" /> actually want to look at.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-ink-dim">
                themephile is a free, open-source theme editor for code. Tune all{" "}
                {ROLE_IDS.length} syntax roles against live previews of VS Code,
                Neovim, Vim, Emacs, and a terminal, then copy a finished config for
                your editor, your terminal, or tmux. No account, nothing uploaded —
                it all runs in your browser.
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

        {/* what it is — the passage designed to be quoted whole */}
        <section className="border-b border-line">
          <div className="mx-auto w-full max-w-3xl px-5 py-14">
            <h2 className="text-balance text-2xl font-medium tracking-tight">
              What is themephile?
            </h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-dim">
              <p>
                themephile is a free, open-source theme editor for code, released
                under the MIT license. It&rsquo;s for developers who&rsquo;d rather
                build their own colorscheme than install someone else&rsquo;s
                &mdash; and it runs entirely in your browser, with no account, no
                backend, and nothing uploaded.
              </p>
              <p>
                Start from one of {PRESET_SEEDS.length} presets, then tune all{" "}
                {ROLE_IDS.length} color roles &mdash; editor chrome, 16 syntax
                roles, 4 diagnostics, and the ANSI 16 &mdash; against live previews
                of VS Code, Neovim, Vim, Emacs, and a terminal, each drawn as the
                real program. Every token in the preview is clickable: you change a
                color by clicking the thing you want to change.
              </p>
              <p>
                Export writes a finished config with install steps &mdash; a VS Code
                extension, a Neovim Lua colorscheme, a Vim colorscheme with cterm
                fallbacks, an Emacs <code className="font-mono">deftheme</code>,
                terminal configs for Alacritty, kitty, Ghostty, WezTerm, and Windows
                Terminal, or raw JSON. The tmux studio writes a complete{" "}
                <code className="font-mono">.tmux.conf</code>.
              </p>
            </div>
          </div>
        </section>

        {/* two tools */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="label">Which tool do you need?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Link
              href="/editor"
              className="panel group flex flex-col overflow-hidden transition-colors hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--color-line))]"
            >
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-lg font-medium tracking-tight">Theme editor</h3>
                <p className="text-sm leading-relaxed text-ink-dim">
                  Preview as VS Code, Neovim, Vim, Emacs, or a terminal — each drawn
                  as the real program. Six languages, 48 editable roles, ten export
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
            <h2 className="label">What does themephile export?</h2>
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

        {/* features — these h3s previously dangled under "Exports to" with no
            h2 of their own, so the hierarchy skipped a level */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <h2 className="label">What you get</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
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

        {/* how it's built — the Who/How/Why evidence, which until now existed
            only in the README where the domain earns nothing from it */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16">
          <h2 className="label">How it&apos;s built</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <div>
              <h3 className="text-[15px] font-medium">
                Checked against the real programs
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                The generated configs aren&apos;t just eyeballed in a preview. The
                Emacs theme has to load under{" "}
                <code className="font-mono text-[13px]">emacs --batch</code>, the Vim
                colorscheme has to source under{" "}
                <code className="font-mono text-[13px]">vim -es -u NONE</code>, and
                every exported{" "}
                <code className="font-mono text-[13px]">.tmux.conf</code> has to boot
                a real tmux server without errors.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-medium">What it doesn&apos;t do</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                There is no sign-up, no upload, no analytics, and no server to send a
                theme to — the palette generator, the highlighter, and all{" "}
                {TARGETS.length} exporters are code that runs in your tab. The whole
                thing is{" "}
                <a
                  href={REPO_URL}
                  className="underline underline-offset-4 transition-colors hover:text-ink"
                >
                  open source under the MIT license
                </a>
                , so you can check that for yourself.
              </p>
            </div>
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
