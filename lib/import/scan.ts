import type { RawColor } from "./types";

/**
 * Tolerant readers for hand-edited config files.
 *
 * None of these are real parsers, and that's deliberate: every file we're
 * handed here was written by a person, often half-copied from a gist, and a
 * strict parser that rejects a trailing comma helps nobody. We only ever need
 * the colors, so we scan for them and ignore everything we don't understand.
 */

const BARE_HEX = /^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Every hex color in the text, in source order, including bare `rrggbb`. */
const HEX_ANYWHERE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

const expand3 = (h: string) =>
  h
    .split("")
    .map((c) => c + c)
    .join("");

/**
 * Parse one value into a color. Accepts `#rgb`, `#rgba`, `#rrggbb`,
 * `#rrggbbaa`, `0xrrggbb`, `rgb()/rgba()`, and bare hex (base16 files omit the
 * `#`). Returns null rather than guessing — callers rely on that to tell
 * "this key had no color" from "this key was black".
 */
export function parseColor(input: string | undefined | null): RawColor | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!s) return null;

  const fn = s.match(/^rgba?\(([^)]+)\)$/i);
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const [r, g, b] = parts.slice(0, 3).map((p) => {
      const n = parseFloat(p);
      return p.includes("%") ? Math.round((n / 100) * 255) : Math.round(n);
    });
    if ([r, g, b].some((n) => !Number.isFinite(n))) return null;
    const a = parts[3] === undefined ? 1 : parseFloat(parts[3]);
    return {
      hex: rgbHex(r, g, b),
      alpha: Number.isFinite(a) ? clampAlpha(a > 1 ? a / 255 : a) : 1,
    };
  }

  s = s.replace(/^0x/i, "").replace(/^#/, "");
  if (!BARE_HEX.test(s)) return null;

  if (s.length === 3) return { hex: `#${expand3(s)}`.toLowerCase(), alpha: 1 };
  if (s.length === 4) {
    return {
      hex: `#${expand3(s.slice(0, 3))}`.toLowerCase(),
      alpha: clampAlpha(parseInt(s[3] + s[3], 16) / 255),
    };
  }
  if (s.length === 6) return { hex: `#${s}`.toLowerCase(), alpha: 1 };
  return {
    hex: `#${s.slice(0, 6)}`.toLowerCase(),
    alpha: clampAlpha(parseInt(s.slice(6, 8), 16) / 255),
  };
}

const clampAlpha = (a: number) => Math.min(1, Math.max(0, a));

const rgbHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0"))
    .join("")}`;

/** Floats 0..1, the way iTerm2 stores components. */
export function componentColor(r: number, g: number, b: number): RawColor {
  return {
    hex: rgbHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)),
    alpha: 1,
  };
}

/** Every hex color in the file, deduped, in source order. */
export function scrapeHexes(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.match(HEX_ANYWHERE) ?? []) {
    const c = parseColor(m);
    if (c) seen.add(c.hex);
  }
  return [...seen];
}

/* -------------------------------------------------------------------------- */
/*                               key/value scan                               */
/* -------------------------------------------------------------------------- */

const COMMENT_START = /^\s*(#|\/\/|--|;|")/;

/**
 * Flatten a config file to dotted keys.
 *
 * One scanner covers TOML sections (`[colors.normal]`), YAML nesting by
 * indent (`colors:` then `  primary:`), and the flat `key value` /
 * `key = value` / `key: value` forms that kitty, Ghostty and Xresources use.
 * Keys come back lowercased; values keep their case because theme names live
 * in them.
 */
export function dottedKeys(text: string): Map<string, string> {
  const out = new Map<string, string>();
  /** TOML `[section]` wins over indent nesting until the next section. */
  let section: string[] = [];
  /** Stack of `[indent, key]` for YAML-style nesting. */
  const stack: [number, string][] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || COMMENT_START.test(rawLine)) continue;
    // An inline `#` can only be a comment when it isn't a color.
    const line = rawLine.replace(/\s+#(?![0-9a-fA-F]{3,8}\b).*$/, "").trimEnd();
    if (!line.trim()) continue;

    const toml = line.trim().match(/^\[+([^\]]+)\]+$/);
    if (toml) {
      section = toml[1].split(".").map((p) => p.trim().toLowerCase());
      stack.length = 0;
      continue;
    }

    const indent = line.length - line.trimStart().length;
    while (stack.length && stack[stack.length - 1][0] >= indent) stack.pop();

    const body = line.trim();
    const sep = body.match(/^([^=:\s]+)\s*([=:])\s*(.*)$/);

    let key: string;
    let value: string;
    if (sep) {
      key = sep[1];
      value = sep[3].trim();
    } else {
      // `key value`, the kitty/Xresources form.
      const ws = body.match(/^(\S+)\s+(.*)$/);
      if (!ws) continue;
      key = ws[1];
      value = ws[2].trim();
    }

    key = key.trim().toLowerCase().replace(/^['"]|['"]$/g, "");
    value = value.replace(/,\s*$/, "").trim();

    if (!value) {
      // A YAML parent key. Remember it and move on.
      stack.push([indent, key]);
      continue;
    }

    const path = [...section, ...stack.map(([, k]) => k), key].join(".");
    if (!out.has(path)) out.set(path, value);
    // Also index by bare key so callers don't have to guess the nesting.
    if (!out.has(key)) out.set(key, value);
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                                 loose JSON                                 */
/* -------------------------------------------------------------------------- */

/**
 * JSON.parse for files that aren't quite JSON. VS Code color themes are JSONC
 * — `//` comments and trailing commas are not just allowed but idiomatic, and
 * `JSON.parse` rejects every one of them.
 */
export function looseJson(text: string): unknown {
  const start = text.search(/[[{]/);
  if (start === -1) return null;

  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += ch;
  }

  try {
    return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
  } catch {
    return null;
  }
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
