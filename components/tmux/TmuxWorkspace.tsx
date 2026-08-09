"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { readableOn } from "@/lib/color";
import { ColorPicker } from "@/components/editor/ColorPicker";
import { ConfigPreview } from "@/components/editor/ConfigPreview";
import { CopyButton } from "@/components/editor/CopyButton";
import { NumberField, Row, Section, Segmented, Toggle } from "@/components/ui/Controls";
import { DEFAULT_THEME, PRESET_SEEDS } from "@/lib/theme/presets";
import { decodeTheme, download, loadTheme } from "@/lib/theme/serialize";
import { deriveTheme, type Theme } from "@/lib/theme/theme";
import {
  MODULES,
  SEPARATORS,
  defaultTmuxConfig,
  tmuxColorsFrom,
  type ModuleId,
  type SeparatorId,
  type TmuxColors,
  type TmuxConfig,
} from "@/lib/tmux/config";
import { generateTmuxConf } from "@/lib/tmux/export";
import { TmuxPreview } from "./TmuxPreview";

const STORAGE_KEY = "themephile:tmux:v1";

const COLOR_FIELDS: { key: keyof TmuxColors; label: string }[] = [
  { key: "statusBg", label: "Status bar" },
  { key: "statusFg", label: "Status text" },
  { key: "accentBg", label: "Accent block" },
  { key: "accentFg", label: "Accent text" },
  { key: "altBg", label: "Second block" },
  { key: "altFg", label: "Second text" },
  { key: "activeWindowBg", label: "Active window" },
  { key: "activeWindowFg", label: "Active w. text" },
  { key: "windowFg", label: "Inactive window" },
  { key: "paneBorder", label: "Pane border" },
  { key: "paneActiveBorder", label: "Active border" },
  { key: "messageBg", label: "Message bar" },
  { key: "messageFg", label: "Message text" },
];

/**
 * Runs on mount only — this component is loaded with `ssr: false`. The palette
 * comes from whatever you last edited, so the two tools always agree.
 */
function restoreTheme(): Theme {
  const hash = window.location.hash;
  const shared = hash.startsWith("#t=") ? decodeTheme(hash.slice(3)) : null;
  return shared ?? loadTheme() ?? DEFAULT_THEME;
}

function restoreConfig(theme: Theme): TmuxConfig {
  const base = defaultTmuxConfig(theme);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<TmuxConfig>;
    // Merge so options added since the config was saved get their defaults.
    return saved.colors ? { ...base, ...saved, colors: { ...base.colors, ...saved.colors } } : base;
  } catch {
    return base;
  }
}

export function TmuxWorkspace() {
  const [theme, setTheme] = useState<Theme>(restoreTheme);
  const [config, setConfig] = useState<TmuxConfig>(() => restoreConfig(restoreTheme()));
  const [colorKey, setColorKey] = useState<keyof TmuxColors | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // Nothing we can do; the config is still in the UI.
      }
    }, 400);
    return () => clearTimeout(id);
  }, [config]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.colors.accent);
    document.documentElement.style.setProperty(
      "--accent-contrast",
      readableOn(theme.colors.accent),
    );
  }, [theme]);

  const patch = useCallback(
    (next: Partial<TmuxConfig>) => setConfig((c) => ({ ...c, ...next })),
    [],
  );

  const setColor = useCallback(
    (key: keyof TmuxColors, hex: string) =>
      setConfig((c) => ({ ...c, colors: { ...c.colors, [key]: hex } })),
    [],
  );

  const applyTheme = (next: Theme) => {
    setTheme(next);
    setConfig((c) => ({ ...c, colors: tmuxColorsFrom(next) }));
  };

  const conf = useMemo(() => generateTmuxConf(config, theme.name), [config, theme.name]);
  const file = useMemo(
    () => ({ filename: ".tmux.conf", language: "conf" as const, contents: conf }),
    [conf],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-canvas/85 px-3 py-2.5 backdrop-blur-md">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 px-1 text-sm font-medium tracking-tight transition-opacity hover:opacity-80"
        >
          <span
            className="size-4 rounded-[5px]"
            style={{
              background: `linear-gradient(135deg, ${config.colors.accentBg}, ${config.colors.activeWindowBg})`,
            }}
          />
          <span className="hidden sm:inline">themephile</span>
        </Link>
        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <h1 className="text-sm font-medium">tmux studio</h1>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <PaletteMenu current={theme.name} onPick={applyTheme} />
          <Link href="/editor" className="btn text-xs">
            Edit palette
          </Link>
          <button
            className="btn text-xs"
            onClick={() => download(".tmux.conf", conf)}
          >
            Download
          </button>
          <CopyButton value={conf} label="Copy .tmux.conf" primary />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3">
          <TmuxPreview config={config} theme={theme} className="min-h-[240px] flex-[5]" />

          <div className="panel flex min-h-0 flex-[4] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
              <code className="font-mono text-[11px] text-ink-dim">~/.tmux.conf</code>
              <span className="label ml-auto">
                {conf.split("\n").length} lines · tmux 3.0+
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ConfigPreview file={file} theme={theme} />
            </div>
          </div>
        </section>

        <aside className="shrink-0 overflow-y-auto border-t border-line lg:w-[368px] lg:border-t-0 lg:border-l">
          <Section title="Status bar">
            <Row label="Position">
              <Segmented
                value={config.statusPosition}
                onChange={(v) => patch({ statusPosition: v })}
                options={[
                  { value: "top", label: "Top" },
                  { value: "bottom", label: "Bottom" },
                ]}
              />
            </Row>
            <Row label="Window list">
              <Segmented
                value={config.justify}
                onChange={(v) => patch({ justify: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "centre", label: "Center" },
                  { value: "right", label: "Right" },
                ]}
              />
            </Row>
            <Row
              label="Separator"
              hint={
                SEPARATORS[config.separator].nerdFont
                  ? "Needs a Nerd Font in your terminal"
                  : "Works with any font"
              }
            >
              <select
                value={config.separator}
                onChange={(e) => patch({ separator: e.target.value as SeparatorId })}
                aria-label="Separator style"
                className="rounded-md border border-line bg-sunken px-2 py-1 text-xs outline-none focus:border-ink-faint"
              >
                {Object.entries(SEPARATORS).map(([id, def]) => (
                  <option key={id} value={id}>
                    {def.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Refresh" hint="How often the right side updates">
              <NumberField
                label="Status interval"
                value={config.statusInterval}
                min={1}
                max={60}
                suffix="sec"
                onChange={(v) => patch({ statusInterval: v })}
              />
            </Row>
            <Row label="Show window index">
              <Toggle
                label="Show window index"
                checked={config.showWindowIndex}
                onChange={(v) => patch({ showWindowIndex: v })}
              />
            </Row>
            <Row label="Zoom flag" hint="Marks a zoomed pane with [Z]">
              <Toggle
                label="Zoom flag"
                checked={config.showZoomFlag}
                onChange={(v) => patch({ showZoomFlag: v })}
              />
            </Row>
          </Section>

          <Section title="Left segments" hint="Shown before the window list.">
            <ModuleEditor
              selected={config.left}
              onChange={(left) => patch({ left })}
            />
          </Section>

          <Section title="Right segments" hint="Shown after the window list.">
            <ModuleEditor
              selected={config.right}
              onChange={(right) => patch({ right })}
            />
          </Section>

          <Section title="Colors" hint="Click a swatch to tune it.">
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_FIELDS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setColorKey(colorKey === key ? null : key)}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                    colorKey === key
                      ? "border-[var(--accent)] bg-raised"
                      : "border-line-soft hover:border-line"
                  }`}
                >
                  <span
                    className="size-4 shrink-0 rounded border border-line"
                    style={{ background: config.colors[key] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-dim">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {colorKey && (
              <div className="mt-2 rounded-lg border border-line bg-sunken p-3">
                <div className="label pb-2">
                  {COLOR_FIELDS.find((f) => f.key === colorKey)?.label}
                </div>
                <ColorPicker
                  value={config.colors[colorKey]}
                  onChange={(hex) => setColor(colorKey, hex)}
                  onCommit={(hex) => setColor(colorKey, hex)}
                />
              </div>
            )}

            <button
              className="btn mt-1 w-full text-xs"
              onClick={() => patch({ colors: tmuxColorsFrom(theme) })}
            >
              Resync from palette
            </button>
          </Section>

          <Section title="Behaviour">
            <Row label="Prefix key">
              <Segmented
                value={config.prefix}
                onChange={(v) => patch({ prefix: v })}
                options={[
                  { value: "C-b", label: "C-b" },
                  { value: "C-a", label: "C-a" },
                  { value: "C-Space", label: "C-Spc" },
                ]}
              />
            </Row>
            <Row label="Mouse support">
              <Toggle
                label="Mouse support"
                checked={config.mouse}
                onChange={(v) => patch({ mouse: v })}
              />
            </Row>
            <Row label="Start numbering at">
              <Segmented
                value={config.baseIndex}
                onChange={(v) => patch({ baseIndex: v })}
                options={[
                  { value: 0, label: "0" },
                  { value: 1, label: "1" },
                ]}
              />
            </Row>
            <Row label="vi keys" hint="Copy mode + hjkl pane movement">
              <Toggle
                label="vi keys"
                checked={config.vimKeys}
                onChange={(v) => patch({ vimKeys: v })}
              />
            </Row>
            <Row label="Splits on | and -" hint="Keeps the current directory">
              <Toggle
                label="Intuitive splits"
                checked={config.intuitiveSplits}
                onChange={(v) => patch({ intuitiveSplits: v })}
              />
            </Row>
            <Row label="Renumber windows">
              <Toggle
                label="Renumber windows"
                checked={config.renumberWindows}
                onChange={(v) => patch({ renumberWindows: v })}
              />
            </Row>
            <Row label="Truecolor" hint="RGB overrides for modern terminals">
              <Toggle
                label="Truecolor"
                checked={config.trueColor}
                onChange={(v) => patch({ trueColor: v })}
              />
            </Row>
            <Row label="Focus events" hint="Neovim autoread needs this">
              <Toggle
                label="Focus events"
                checked={config.focusEvents}
                onChange={(v) => patch({ focusEvents: v })}
              />
            </Row>
            <Row label="Escape time" hint="Lower = snappier Esc in vim">
              <NumberField
                label="Escape time"
                value={config.escapeTime}
                min={0}
                max={500}
                step={5}
                suffix="ms"
                onChange={(v) => patch({ escapeTime: v })}
              />
            </Row>
            <Row label="Scrollback">
              <NumberField
                label="History limit"
                value={config.historyLimit}
                min={1000}
                max={500000}
                step={1000}
                suffix="lines"
                onChange={(v) => patch({ historyLimit: v })}
              />
            </Row>
            <Row label="Pane borders">
              <select
                value={config.paneBorderLines}
                onChange={(e) =>
                  patch({
                    paneBorderLines: e.target
                      .value as TmuxConfig["paneBorderLines"],
                  })
                }
                aria-label="Pane border lines"
                className="rounded-md border border-line bg-sunken px-2 py-1 text-xs outline-none focus:border-ink-faint"
              >
                {["single", "double", "heavy", "simple", "number"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section title="Install">
            <ol className="flex flex-col gap-1.5 text-[11.5px] leading-relaxed text-ink-dim">
              <li>1. Copy the config into `~/.tmux.conf`.</li>
              <li>
                2. Reload it with{" "}
                <code className="rounded bg-raised px-1 font-mono text-[10.5px]">
                  tmux source-file ~/.tmux.conf
                </code>
                .
              </li>
              <li>3. Or press prefix + r — that binding is included.</li>
            </ol>
          </Section>
        </aside>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ModuleEditor({
  selected,
  onChange,
}: {
  selected: ModuleId[];
  onChange: (ids: ModuleId[]) => void;
}) {
  const available = (Object.keys(MODULES) as ModuleId[]).filter(
    (id) => !selected.includes(id),
  );

  const move = (index: number, delta: number) => {
    const next = [...selected];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {selected.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-1.5 rounded-md border border-line-soft bg-sunken px-2 py-1.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] text-ink-dim">
                {MODULES[id].label}
              </span>
              <code className="block truncate font-mono text-[10px] text-ink-faint">
                {MODULES[id].tmux}
              </code>
            </span>
            <button
              className="rounded px-1 text-ink-faint hover:text-ink disabled:opacity-30"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={`Move ${MODULES[id].label} earlier`}
            >
              ↑
            </button>
            <button
              className="rounded px-1 text-ink-faint hover:text-ink disabled:opacity-30"
              disabled={i === selected.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Move ${MODULES[id].label} later`}
            >
              ↓
            </button>
            <button
              className="rounded px-1 text-ink-faint hover:text-red-400"
              onClick={() => onChange(selected.filter((x) => x !== id))}
              aria-label={`Remove ${MODULES[id].label}`}
            >
              ×
            </button>
          </li>
        ))}
        {selected.length === 0 && (
          <li className="rounded-md border border-dashed border-line px-2 py-3 text-center text-[11px] text-ink-faint">
            Empty
          </li>
        )}
      </ul>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {available.map((id) => (
            <button
              key={id}
              onClick={() => onChange([...selected, id])}
              title={MODULES[id].note ?? MODULES[id].tmux}
              className="rounded-md border border-line-soft px-1.5 py-1 text-[11px] text-ink-faint transition-colors hover:border-line hover:text-ink"
            >
              + {MODULES[id].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PaletteMenu({
  current,
  onPick,
}: {
  current: string;
  onPick: (theme: Theme) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // A click anywhere else closes it; the buttons stop propagation themselves.
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        className="btn text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        {current}
        <svg aria-hidden viewBox="0 0 12 12" className="size-3 opacity-60" fill="currentColor">
          <path d="M2.5 4.5L6 8l3.5-3.5z" />
        </svg>
      </button>
      {open && (
        <div className="panel animate-fade absolute right-0 z-40 mt-1.5 w-56 p-1 shadow-2xl">
          {PRESET_SEEDS.map((seed) => {
            const t = deriveTheme(seed);
            return (
              <button
                key={seed.name}
                onClick={() => onPick(t)}
                className="flex w-full items-center gap-2.5 rounded-md p-2 text-left text-[13px] transition-colors hover:bg-raised"
              >
                <span
                  className="size-5 shrink-0 rounded border border-line"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.accent}, ${t.colors.ansiBlue})`,
                  }}
                />
                {seed.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
