import type { RoleId } from "@/lib/theme/roles";
import { ANSI_NAMES } from "./maps";
import { componentColor, dottedKeys, isRecord, looseJson, parseColor } from "./scan";
import type { PartialColors, ParseResult, Parser, RawColor } from "./types";

/**
 * Terminal formats. Every one of these carries the same twenty-odd colors —
 * sixteen ANSI slots plus background, foreground, cursor and selection — and
 * nothing at all about syntax. `completeTheme` grows the rest, which is the
 * point: a kitty conf you already like becomes a full editor theme.
 */

const setAnsi = (colors: PartialColors, slot: number, raw: unknown) => {
  if (slot < 0 || slot > 15) return;
  const parsed = parseColor(typeof raw === "string" ? raw : null);
  if (parsed) colors[ANSI_NAMES[slot]] = parsed;
};

const put = (colors: PartialColors, role: RoleId, raw: string | undefined) => {
  const parsed = parseColor(raw);
  if (parsed && !colors[role]) colors[role] = parsed;
};

/** kv lookup that takes the first key present, so section paths stay optional. */
const first = (kv: Map<string, string>, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = kv.get(k);
    if (v !== undefined) return v;
  }
  return undefined;
};

const NAMED = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
] as const;

const nonEmpty = (colors: PartialColors) =>
  Object.keys(colors).length ? colors : null;

/* -------------------------------------------------------------------------- */
/*                                 Alacritty                                  */
/* -------------------------------------------------------------------------- */

/**
 * Alacritty moved from YAML to TOML in 0.13, and both are still in the wild.
 * The dotted scanner flattens them to the same paths, so one reader covers
 * `[colors.normal]` and a two-space-indented `colors:` block alike.
 */
function parseAlacritty(text: string): ParseResult | null {
  const kv = dottedKeys(text);
  const colors: PartialColors = {};

  put(colors, "bg", first(kv, "colors.primary.background", "primary.background"));
  put(colors, "fg", first(kv, "colors.primary.foreground", "primary.foreground"));
  put(colors, "fgDim", first(kv, "colors.primary.dim_foreground"));
  put(colors, "cursor", first(kv, "colors.cursor.cursor", "cursor.cursor"));
  put(
    colors,
    "selection",
    first(kv, "colors.selection.background", "selection.background"),
  );
  put(colors, "matchBg", first(kv, "colors.search.matches.background"));
  put(colors, "accent", first(kv, "colors.vi_mode_cursor.cursor"));
  put(colors, "bgAlt", first(kv, "colors.footer_bar.background"));

  NAMED.forEach((name, i) => {
    setAnsi(colors, i, first(kv, `colors.normal.${name}`, `normal.${name}`));
    setAnsi(colors, i + 8, first(kv, `colors.bright.${name}`, `bright.${name}`));
  });

  return nonEmpty(colors) && { format: "alacritty", colors };
}

export const alacrittyParser: Parser = {
  id: "alacritty",
  label: "Alacritty",
  blurb: "TOML or the older YAML — `[colors.normal]`, `[colors.bright]`.",
  detect: (text) =>
    /\[colors\.(primary|normal|bright)\]/.test(text) ||
    (/^colors:/m.test(text) && /^\s+(primary|normal|bright):/m.test(text)),
  parse: parseAlacritty,
};

/* -------------------------------------------------------------------------- */
/*                                   kitty                                    */
/* -------------------------------------------------------------------------- */

function parseKitty(text: string): ParseResult | null {
  const kv = dottedKeys(text);
  const colors: PartialColors = {};

  put(colors, "bg", kv.get("background"));
  put(colors, "fg", kv.get("foreground"));
  put(colors, "cursor", kv.get("cursor"));
  put(colors, "selection", kv.get("selection_background"));
  put(colors, "accent", kv.get("active_border_color"));
  put(colors, "border", kv.get("inactive_border_color"));
  put(colors, "bgAlt", kv.get("tab_bar_background") ?? kv.get("inactive_tab_background"));
  put(colors, "fgDim", kv.get("inactive_tab_foreground"));
  put(colors, "info", kv.get("url_color"));
  put(colors, "warning", kv.get("bell_border_color"));

  for (let i = 0; i < 16; i++) setAnsi(colors, i, kv.get(`color${i}`));

  return nonEmpty(colors) && { format: "kitty", colors };
}

export const kittyParser: Parser = {
  id: "kitty",
  label: "kitty",
  blurb: "A kitty theme — `color0`…`color15` plus the tab bar.",
  detect: (text) => /^\s*color0\s+\S/m.test(text) || /^\s*selection_background\s/m.test(text),
  parse: parseKitty,
};

/* -------------------------------------------------------------------------- */
/*                                  Ghostty                                   */
/* -------------------------------------------------------------------------- */

/**
 * Ghostty repeats one key sixteen times (`palette = 0=#…`), so the palette is
 * scanned straight from the text — a key/value map would keep only the first.
 */
function parseGhostty(text: string): ParseResult | null {
  const kv = dottedKeys(text);
  const colors: PartialColors = {};

  put(colors, "bg", kv.get("background"));
  put(colors, "fg", kv.get("foreground"));
  put(colors, "cursor", kv.get("cursor-color"));
  put(colors, "selection", kv.get("selection-background"));

  for (const [, slot, value] of text.matchAll(
    /^\s*palette\s*=\s*(\d{1,2})\s*=\s*(\S+)/gm,
  )) {
    setAnsi(colors, Number(slot), value);
  }

  return nonEmpty(colors) && { format: "ghostty", colors };
}

export const ghosttyParser: Parser = {
  id: "ghostty",
  label: "Ghostty",
  blurb: "A Ghostty theme file — `palette = 0=…` through `15=…`.",
  detect: (text) => /^\s*palette\s*=\s*\d{1,2}\s*=/m.test(text),
  parse: parseGhostty,
};

/* -------------------------------------------------------------------------- */
/*                                  WezTerm                                   */
/* -------------------------------------------------------------------------- */

function parseWezterm(text: string): ParseResult | null {
  const colors: PartialColors = {};
  const scalar = (key: string) =>
    text.match(new RegExp(`\\b${key}\\s*=\\s*["']([^"']+)["']`))?.[1];

  put(colors, "bg", scalar("background"));
  put(colors, "fg", scalar("foreground"));
  put(colors, "cursor", scalar("cursor_bg"));
  put(colors, "selection", scalar("selection_bg"));
  put(colors, "border", scalar("split") ?? scalar("scrollbar_thumb"));

  const list = (key: string) => {
    const block = text.match(new RegExp(`\\b${key}\\s*=\\s*\\{([^}]*)\\}`));
    return block ? [...block[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) : [];
  };
  list("ansi").slice(0, 8).forEach((hex, i) => setAnsi(colors, i, hex));
  list("brights").slice(0, 8).forEach((hex, i) => setAnsi(colors, i + 8, hex));

  return nonEmpty(colors) && { format: "wezterm", colors };
}

export const weztermParser: Parser = {
  id: "wezterm",
  label: "WezTerm",
  blurb: "A Lua color scheme — `ansi` and `brights` lists.",
  detect: (text) => /\bansi\s*=\s*\{/.test(text) && /\bbrights\s*=\s*\{/.test(text),
  parse: parseWezterm,
};

/* -------------------------------------------------------------------------- */
/*                             Windows Terminal                               */
/* -------------------------------------------------------------------------- */

function parseWindowsTerminal(text: string): ParseResult | null {
  const root = looseJson(text);
  if (!isRecord(root)) return null;

  // Accept a whole settings.json as well as a bare scheme object.
  const schemes = root.schemes;
  const scheme =
    Array.isArray(schemes) && isRecord(schemes[0]) ? schemes[0] : root;
  if (!isRecord(scheme)) return null;

  // Schemes in the wild are inconsistently cased, and ANSI 5 is `purple` here
  // but `magenta` everywhere else, so both spellings are accepted.
  const lookup = new Map(
    Object.entries(scheme).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const str = (...keys: string[]) => {
    for (const k of keys) {
      const v = lookup.get(k.toLowerCase());
      if (typeof v === "string") return v;
    }
    return undefined;
  };
  const colors: PartialColors = {};

  put(colors, "bg", str("background"));
  put(colors, "fg", str("foreground"));
  put(colors, "cursor", str("cursorColor"));
  put(colors, "selection", str("selectionBackground"));

  NAMED.forEach((name, i) => {
    const alt = name === "magenta" ? ["purple"] : [];
    setAnsi(colors, i, str(name, ...alt));
    setAnsi(colors, i + 8, str(`bright${name}`, ...alt.map((a) => `bright${a}`)));
  });

  return (
    nonEmpty(colors) && {
      format: "windows-terminal",
      name: typeof scheme.name === "string" ? scheme.name : undefined,
      colors,
    }
  );
}

export const windowsTerminalParser: Parser = {
  id: "windows-terminal",
  label: "Windows Terminal",
  blurb: "A scheme object from the Windows Terminal settings file.",
  detect: (text) =>
    /"bright(white|black)"/i.test(text) && /"(black|purple)"\s*:/i.test(text),
  parse: parseWindowsTerminal,
};

/* -------------------------------------------------------------------------- */
/*                                  iTerm2                                    */
/* -------------------------------------------------------------------------- */

/**
 * `.itermcolors` is an XML plist storing each channel as a 0..1 float. This is
 * the format most worth accepting as a file rather than a paste — nobody has
 * ever opened one in a text editor on purpose.
 */
function parseIterm(text: string): ParseResult | null {
  const colors: PartialColors = {};
  const entries = text.matchAll(
    /<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g,
  );

  const component = (body: string, channel: string) => {
    const m = body.match(
      new RegExp(`<key>${channel} Component</key>\\s*<real>([\\d.eE+-]+)</real>`),
    );
    return m ? parseFloat(m[1]) : NaN;
  };

  const slots: Record<string, RoleId> = {
    "Background Color": "bg",
    "Foreground Color": "fg",
    "Cursor Color": "cursor",
    "Selection Color": "selection",
    "Bold Color": "fgDim",
    "Link Color": "info",
  };

  for (const [, key, body] of entries) {
    const [r, g, b] = ["Red", "Green", "Blue"].map((c) => component(body, c));
    if (![r, g, b].every(Number.isFinite)) continue;
    const color = componentColor(r, g, b);

    const ansi = key.match(/^Ansi (\d{1,2}) Color$/);
    if (ansi) {
      const slot = Number(ansi[1]);
      if (slot <= 15) colors[ANSI_NAMES[slot]] = color;
      continue;
    }
    const role = slots[key];
    if (role && !colors[role]) colors[role] = color;
  }

  return nonEmpty(colors) && { format: "iterm2", colors };
}

export const itermParser: Parser = {
  id: "iterm2",
  label: "iTerm2",
  blurb: "An `.itermcolors` plist — channels stored as floats.",
  detect: (text) => /<plist/.test(text) && /Ansi \d+ Color/.test(text),
  parse: parseIterm,
};

/* -------------------------------------------------------------------------- */
/*                                 Xresources                                 */
/* -------------------------------------------------------------------------- */

function parseXresources(text: string): ParseResult | null {
  const colors: PartialColors = {};

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*!/.test(line)) continue;
    const m = line.match(/^\s*[\w.*]*?[*.]?(\w+)\s*:\s*(\S+)/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2];

    const slot = key.match(/^color(\d{1,2})$/);
    if (slot) {
      setAnsi(colors, Number(slot[1]), value);
      continue;
    }
    if (key === "background") put(colors, "bg", value);
    else if (key === "foreground") put(colors, "fg", value);
    else if (key === "cursorcolor") put(colors, "cursor", value);
  }

  return nonEmpty(colors) && { format: "xresources", colors };
}

export const xresourcesParser: Parser = {
  id: "xresources",
  label: "Xresources",
  blurb: "`*.color0` through `*.color15`, the way X has always done it.",
  detect: (text) => /^\s*[\w.*]*[*.]color\d{1,2}\s*:/m.test(text),
  parse: parseXresources,
};

export type { RawColor };
