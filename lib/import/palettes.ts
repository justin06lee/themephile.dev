import { hexToOklch, oklchToHex } from "@/lib/color";
import { ROLE_IDS, type RoleId } from "@/lib/theme/roles";
import type { Appearance } from "@/lib/theme/theme";
import { ANSI_NAMES, BASE16_ROLES, BASE24_BRIGHTS } from "./maps";
import { dottedKeys, isRecord, looseJson, parseColor, scrapeHexes } from "./scan";
import type { PartialColors, ParseResult, Parser } from "./types";

/* -------------------------------------------------------------------------- */
/*                            themephile's own JSON                           */
/* -------------------------------------------------------------------------- */

function parseThemephile(text: string): ParseResult | null {
  const root = looseJson(text);
  if (!isRecord(root)) return null;
  const source = isRecord(root.colors) ? root.colors : root;

  const colors: PartialColors = {};
  for (const role of ROLE_IDS) {
    const hit = parseColor(source[role] as string);
    if (hit) colors[role] = hit;
  }
  if (Object.keys(colors).length < 8) return null;

  return {
    format: "themephile",
    name: typeof root.name === "string" ? root.name : undefined,
    appearance: root.appearance === "light" ? "light" : root.appearance === "dark" ? "dark" : undefined,
    colors,
  };
}

export const themephileParser: Parser = {
  id: "themephile",
  label: "themephile JSON",
  blurb: "Our own export — every role by name, so it round-trips exactly.",
  detect: (text) =>
    /themephile/.test(text) || (/"lineNumberActive"/.test(text) && /"ansiBrightBlack"/.test(text)),
  parse: parseThemephile,
};

/* -------------------------------------------------------------------------- */
/*                                base16 / base24                             */
/* -------------------------------------------------------------------------- */

/**
 * base16 is the one community format with *documented* meanings per slot —
 * base0B is strings, base0D is functions, and every scheme author honored
 * that. So a base16 file converts into a real editor theme rather than a
 * guess, which is not true of any terminal format.
 */
function parseBase16(text: string): ParseResult | null {
  const kv = dottedKeys(text);

  // The scanner lowercases keys, so `base0A` has to be asked for as `base0a`.
  const slot = (raw: string) => {
    const name = raw.toLowerCase();
    return parseColor(
      kv.get(name) ?? kv.get(`palette.${name}`) ?? kv.get(`colors.${name}`),
    );
  };

  if (!slot("base00") || !slot("base05")) return null;

  const colors: PartialColors = {};
  for (const role of ROLE_IDS) {
    const name = BASE16_ROLES[role];
    const hit = name ? slot(name) : null;
    if (hit) colors[role] = hit;
  }
  // base24 carries genuine bright colors; prefer them over the base16 reuse.
  for (const [role, name] of Object.entries(BASE24_BRIGHTS)) {
    const hit = slot(name);
    if (hit) colors[role as RoleId] = hit;
  }

  const name = kv.get("scheme") ?? kv.get("name");
  return {
    format: "base16",
    name: name?.replace(/^["']|["']$/g, ""),
    colors,
    notes: [
      "base16 assigns fixed meanings to base08–base0F, so syntax came across directly rather than being inferred.",
    ],
  };
}

export const base16Parser: Parser = {
  id: "base16",
  label: "base16 / base24",
  blurb: "A base16 or base24 scheme — `base00` through `base0F`.",
  detect: (text) => /\bbase00\b/.test(text) && /\bbase0[dDeE]\b/.test(text),
  parse: parseBase16,
};

/* -------------------------------------------------------------------------- */
/*                              a bare list of hex                            */
/* -------------------------------------------------------------------------- */

/** The canonical ANSI hues, so scraped colors land in believable slots. */
const ANSI_HUE: [RoleId, number][] = [
  ["ansiRed", 27],
  ["ansiYellow", 90],
  ["ansiGreen", 148],
  ["ansiCyan", 200],
  ["ansiBlue", 255],
  ["ansiMagenta", 328],
];

const hueGap = (a: number, b: number) => {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Last resort: any text with colors in it. Someone pastes a palette from a
 * blog post, a Coolors link, or a colorscheme in a format we've never seen —
 * sort the colors by lightness and chroma and put them somewhere sensible.
 */
function parseHexList(text: string): ParseResult | null {
  const hexes = scrapeHexes(text);
  if (hexes.length < 3) return null;

  const swatches = hexes.map((hex) => ({ hex, ...hexToOklch(hex) }));
  const byLight = [...swatches].sort((a, b) => a.l - b.l);
  const chromatic = swatches.filter((s) => s.c > 0.035).sort((a, b) => b.c - a.c);

  const median = byLight[Math.floor(byLight.length / 2)].l;
  const appearance: Appearance = median < 0.5 ? "dark" : "light";
  const dark = appearance === "dark";

  const colors: PartialColors = {};
  const bg = dark ? byLight[0] : byLight[byLight.length - 1];
  const fg = dark ? byLight[byLight.length - 1] : byLight[0];
  colors.bg = { hex: bg.hex, alpha: 1 };
  colors.fg = { hex: fg.hex, alpha: 1 };

  if (chromatic.length) {
    const used = new Set<string>();
    for (const [role, hue] of ANSI_HUE) {
      const pool = chromatic.filter((s) => !used.has(s.hex));
      const from = pool.length ? pool : chromatic;
      const best = from.reduce((a, b) => (hueGap(a.h, hue) <= hueGap(b.h, hue) ? a : b));
      used.add(best.hex);
      colors[role] = { hex: best.hex, alpha: 1 };
      colors[`ansiBright${role.slice(4)}` as RoleId] = {
        hex: oklchToHex({ ...best, l: Math.min(0.95, best.l + (dark ? 0.09 : 0.06)) }),
        alpha: 1,
      };
    }
  }

  return {
    format: "hex-list",
    appearance,
    colors,
    notes: [
      `Read ${hexes.length} colors with no recognizable format around them, so they were sorted by lightness and hue into the closest slots. Expect to do some tidying.`,
    ],
  };
}

export const hexListParser: Parser = {
  id: "hex-list",
  label: "Loose colors",
  blurb: "Any text with hex colors in it — sorted into the nearest slots.",
  detect: () => true,
  parse: parseHexList,
};

export { ANSI_NAMES };
