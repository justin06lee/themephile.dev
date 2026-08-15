"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PRESET_SEEDS } from "@/lib/theme/presets";
import { shareUrl } from "@/lib/theme/serialize";
import {
  boostContrast,
  deriveTheme,
  lowContrastRoles,
  randomSeed,
  withAppearance,
  type Theme,
  type ThemeSeed,
} from "@/lib/theme/theme";

type Props = {
  theme: Theme;
  onCommit: (theme: Theme) => void;
  onUndo: () => void;
  canUndo: boolean;
  onExport: () => void;
  onImport: () => void;
};

export function Toolbar({
  theme,
  onCommit,
  onUndo,
  canUndo,
  onExport,
  onImport,
}: Props) {
  const [shared, setShared] = useState(false);
  const failing = lowContrastRoles(theme).length;

  const applySeed = (seed: ThemeSeed) => onCommit(deriveTheme(seed));

  const share = async () => {
    const url = shareUrl(theme);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-canvas/85 px-3 py-2.5 backdrop-blur-md">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1 text-sm font-medium tracking-tight transition-opacity hover:opacity-80"
      >
        <span
          className="size-4 rounded-[5px]"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.string})`,
          }}
        />
        <span className="hidden sm:inline">themephile</span>
      </Link>

      <div className="mx-1 hidden h-5 w-px bg-line sm:block" />

      {/* Mirrors the skeleton's h1 so the heading survives hydration, and
          mirrors TmuxWorkspace, which already does this. Deliberately not
          `hidden sm:block`: Googlebot renders at a mobile viewport. */}
      <h1 className="shrink-0 text-sm font-medium">Theme editor</h1>

      <input
        value={theme.name}
        onChange={(e) => onCommit({ ...theme, name: e.target.value })}
        aria-label="Theme name"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none hover:border-line focus:border-line focus:bg-sunken sm:max-w-56"
      />

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <PresetMenu onPick={applySeed} />

        {/* Sits with Presets rather than with Export: both answer "what am I
            starting from?", and Export answers "where does it go?". */}
        <button
          className="btn text-xs"
          title="Paste or drop a theme you already have"
          onClick={onImport}
        >
          Import
        </button>

        <button
          className="btn text-xs"
          title="Generate a fresh palette"
          onClick={() => applySeed({ ...randomSeed(theme.appearance) })}
        >
          Shuffle
        </button>

        <button
          className="btn text-xs"
          title="Switch between a dark and light base"
          onClick={() =>
            applySeed(
              withAppearance(theme.seed, theme.appearance === "dark" ? "light" : "dark"),
            )
          }
        >
          {theme.appearance === "dark" ? "Light" : "Dark"}
        </button>

        <button
          className="btn text-xs"
          title={
            failing
              ? `${failing} role${failing === 1 ? "" : "s"} below WCAG AA-large`
              : "Everything already clears WCAG AA-large"
          }
          disabled={failing === 0}
          onClick={() => onCommit(boostContrast(theme))}
          style={failing === 0 ? { opacity: 0.45, cursor: "default" } : undefined}
        >
          Fix contrast
          {failing > 0 && (
            <span className="ml-1 rounded bg-amber-400/15 px-1 font-mono text-[10px] text-amber-300">
              {failing}
            </span>
          )}
        </button>

        <button
          className="btn btn-ghost text-xs"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          style={!canUndo ? { opacity: 0.4, cursor: "default" } : undefined}
        >
          Undo
        </button>

        {/* /tmux already links back here ("Edit palette"); this closes the loop. */}
        <Link href="/tmux" className="btn text-xs" title="Build a matching tmux status bar">
          tmux studio
        </Link>

        <button className="btn text-xs" onClick={share}>
          {shared ? "Link copied" : "Share"}
        </button>

        <button className="btn btn-primary text-xs" onClick={onExport}>
          Export
        </button>
      </div>
    </header>
  );
}

function PresetMenu({ onPick }: { onPick: (seed: ThemeSeed) => void }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        className="btn text-xs"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Presets
        <svg aria-hidden viewBox="0 0 12 12" className="size-3 opacity-60" fill="currentColor">
          <path d="M2.5 4.5L6 8l3.5-3.5z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="panel animate-fade absolute right-0 z-40 mt-1.5 w-72 overflow-hidden p-1 shadow-2xl"
        >
          {PRESET_SEEDS.map((seed) => {
            const t = deriveTheme(seed);
            return (
              <button
                key={seed.name}
                role="menuitem"
                onClick={() => {
                  onPick(seed);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-raised"
              >
                <span
                  className="flex size-9 shrink-0 flex-col justify-center gap-[3px] rounded-md border border-line p-1.5"
                  style={{ background: t.colors.bg }}
                >
                  {(["keyword", "string", "function"] as const).map((role) => (
                    <span
                      key={role}
                      className="h-[3px] rounded-full"
                      style={{
                        background: t.colors[role],
                        width: role === "string" ? "70%" : "100%",
                      }}
                    />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px]">{seed.name}</span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {seed.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
