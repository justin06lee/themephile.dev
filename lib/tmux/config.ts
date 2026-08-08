import type { Theme } from "@/lib/theme/theme";
import { mix, readableOn } from "@/lib/color";

/* -------------------------------------------------------------------------- */
/*                                  modules                                   */
/* -------------------------------------------------------------------------- */

export type ModuleId =
  | "session"
  | "prefix"
  | "host"
  | "user"
  | "path"
  | "command"
  | "windows"
  | "time"
  | "date"
  | "uptime";

export type ModuleDef = {
  label: string;
  /** The tmux format string that goes in the config. */
  tmux: string;
  /** What it looks like right now, for the preview. */
  sample: string;
  note?: string;
};

export const MODULES: Record<ModuleId, ModuleDef> = {
  session: { label: "Session", tmux: "#S", sample: "themephile" },
  prefix: {
    label: "Prefix flag",
    tmux: "#{?client_prefix,PREFIX,·}",
    sample: "·",
    note: "Lights up while the prefix key is held.",
  },
  host: { label: "Hostname", tmux: "#H", sample: "apollo" },
  user: { label: "User", tmux: "#(whoami)", sample: "you", note: "Shells out once per interval." },
  path: { label: "Directory", tmux: "#{b:pane_current_path}", sample: "themephile" },
  command: { label: "Command", tmux: "#{pane_current_command}", sample: "nvim" },
  windows: { label: "Window count", tmux: "#{session_windows}w", sample: "4w" },
  time: { label: "Time", tmux: "%H:%M", sample: "14:32" },
  date: { label: "Date", tmux: "%a %d %b", sample: "Fri 07 Aug" },
  uptime: {
    // awk rather than sed: no backslashes, so it survives tmux string escaping.
    label: "Uptime",
    tmux: "#(uptime | awk -F'up ' '{print $2}' | awk -F, '{print $1}')",
    sample: "6 days",
    note: "Shells out once per interval.",
  },
};

/* -------------------------------------------------------------------------- */
/*                                 separators                                 */
/* -------------------------------------------------------------------------- */

export type SeparatorId = "none" | "powerline" | "round" | "slant" | "bar";

export type SeparatorDef = {
  label: string;
  /** Glyph pointing away from the left edge, and its mirror on the right. */
  left: string;
  right: string;
  nerdFont: boolean;
};

export const SEPARATORS: Record<SeparatorId, SeparatorDef> = {
  none: { label: "None", left: "", right: "", nerdFont: false },
  powerline: { label: "Powerline", left: "", right: "", nerdFont: true },
  round: { label: "Round", left: "", right: "", nerdFont: true },
  slant: { label: "Slant", left: "", right: "", nerdFont: true },
  bar: { label: "Thin bar", left: "│", right: "│", nerdFont: false },
};

/* -------------------------------------------------------------------------- */
/*                                   config                                   */
/* -------------------------------------------------------------------------- */

export type TmuxColors = {
  statusBg: string;
  statusFg: string;
  accentBg: string;
  accentFg: string;
  altBg: string;
  altFg: string;
  activeWindowBg: string;
  activeWindowFg: string;
  windowFg: string;
  paneBorder: string;
  paneActiveBorder: string;
  messageBg: string;
  messageFg: string;
};

export type TmuxConfig = {
  prefix: "C-b" | "C-a" | "C-Space";
  mouse: boolean;
  baseIndex: 0 | 1;
  escapeTime: number;
  historyLimit: number;
  vimKeys: boolean;
  intuitiveSplits: boolean;
  renumberWindows: boolean;
  focusEvents: boolean;
  trueColor: boolean;

  statusPosition: "top" | "bottom";
  statusInterval: number;
  justify: "left" | "centre" | "right";
  separator: SeparatorId;
  left: ModuleId[];
  right: ModuleId[];
  showWindowIndex: boolean;
  showZoomFlag: boolean;
  paneBorderLines: "single" | "double" | "heavy" | "simple" | "number";

  colors: TmuxColors;
};

/** Sensible tmux colors pulled from an editor theme. */
export function tmuxColorsFrom(theme: Theme): TmuxColors {
  const c = theme.colors;
  return {
    statusBg: c.bgAlt,
    statusFg: c.fgDim,
    accentBg: c.accent,
    accentFg: readableOn(c.accent),
    altBg: mix(c.bgAlt, c.fg, 0.12),
    altFg: c.fg,
    activeWindowBg: c.ansiBlue,
    activeWindowFg: readableOn(c.ansiBlue),
    windowFg: c.fgDim,
    paneBorder: c.border,
    paneActiveBorder: c.accent,
    messageBg: c.warning,
    messageFg: readableOn(c.warning),
  };
}

export function defaultTmuxConfig(theme: Theme): TmuxConfig {
  return {
    prefix: "C-a",
    mouse: true,
    baseIndex: 1,
    escapeTime: 10,
    historyLimit: 50000,
    vimKeys: true,
    intuitiveSplits: true,
    renumberWindows: true,
    focusEvents: true,
    trueColor: true,

    statusPosition: "top",
    statusInterval: 5,
    justify: "left",
    separator: "powerline",
    left: ["session", "prefix"],
    right: ["path", "host", "time"],
    showWindowIndex: true,
    showZoomFlag: true,
    paneBorderLines: "single",

    colors: tmuxColorsFrom(theme),
  };
}

/* -------------------------------------------------------------------------- */
/*                                  segments                                  */
/* -------------------------------------------------------------------------- */

export type Segment = {
  id: string;
  /** tmux format string. */
  tmux: string;
  /** Human-readable stand-in for the preview. */
  sample: string;
  fg: string;
  bg: string;
};

/** Powerline-ish separators fill their segments; the others sit on the bar. */
export const isFilled = (sep: SeparatorId) =>
  sep === "powerline" || sep === "round" || sep === "slant";

/**
 * Segment colors step down from the accent so a powerline reads as a chain.
 * Unfilled styles instead print the accent as text on the bar itself.
 */
export function buildSegments(
  ids: ModuleId[],
  colors: TmuxColors,
  side: "left" | "right",
  filled: boolean,
): Segment[] {
  const chain: [string, string][] = filled
    ? [
        [colors.accentFg, colors.accentBg],
        [colors.altFg, colors.altBg],
        [colors.statusFg, colors.statusBg],
      ]
    : [
        [colors.accentBg, colors.statusBg],
        [colors.statusFg, colors.statusBg],
        [colors.statusFg, colors.statusBg],
      ];

  const tones = side === "left" ? chain : [...chain].reverse();
  const count = ids.length;

  return ids.map((id, i) => {
    // Left chains start at the accent; right chains end there.
    const toneIndex =
      side === "left"
        ? Math.min(i, tones.length - 1)
        : Math.max(0, tones.length - (count - i));
    const [fg, bg] = tones[toneIndex];
    const def = MODULES[id];
    return { id, tmux: def.tmux, sample: def.sample, fg, bg };
  });
}
