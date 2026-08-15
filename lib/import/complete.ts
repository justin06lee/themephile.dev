import { contrastRatio, flatten, hexToOklch, isLight, mix, oklchToHex } from "@/lib/color";
import { ROLE_IDS, type ColorMap, type RoleId } from "@/lib/theme/roles";
import type { Appearance, Theme, ThemeSeed } from "@/lib/theme/theme";
import type { ImportReport, ParseResult } from "./types";

/**
 * Growing a partial read into a whole theme.
 *
 * Most formats are partial by nature. A kitty conf has sixteen ANSI slots and
 * nothing about comments; a Vim colorscheme has comments and nothing about
 * ANSI. Rather than leave the gaps black, each missing role is derived from
 * what *was* found, following the base16 convention for which terminal color
 * stands in for which syntax idea — that's the mapping every scheme author has
 * been writing against for a decade, so the result reads like a real theme
 * instead of a fill.
 *
 * Every derived role is reported, so the import dialog can say plainly how
 * much came from the file and how much we made up.
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Shift a color in OKLCh, which keeps the hue recognizable. */
const shift = (hex: string, dl: number, cf = 1) => {
  const c = hexToOklch(hex);
  return oklchToHex({ l: clamp(c.l + dl, 0, 1), c: Math.max(0, c.c * cf), h: c.h });
};

export function completeTheme(
  parsed: ParseResult,
  fallbackName: string,
  formatLabel: string,
): { theme: Theme; report: ImportReport } {
  const src = parsed.colors;
  const matched = ROLE_IDS.filter((id) => src[id]);
  const derived: RoleId[] = [];
  const notes = [...(parsed.notes ?? [])];

  /** First of these roles the file actually supplied. */
  const pick = (...roles: RoleId[]) => {
    for (const r of roles) if (src[r]) return src[r]!.hex;
    return undefined;
  };

  // ── the canvas, which everything else is measured against ──
  const bgHit = src.bg ?? src.ansiBlack;
  const fgHit = src.fg ?? src.ansiWhite;

  const appearance: Appearance =
    parsed.appearance ??
    (bgHit
      ? isLight(bgHit.hex)
        ? "light"
        : "dark"
      : fgHit && isLight(fgHit.hex)
        ? "dark"
        : "dark");
  const dark = appearance === "dark";

  const bg = bgHit?.hex ?? (dark ? "#0e1016" : "#fbfbfd");
  const fg = fgHit?.hex ?? (dark ? "#dfe3ec" : "#22252c");

  const out = {} as ColorMap;

  /**
   * Take the file's value, compositing away any alpha channel — VS Code writes
   * `editor.selectionBackground` as `#rrggbbaa` almost universally, and simply
   * dropping the alpha turns a soft selection into a neon block.
   */
  const take = (role: RoleId, fallback: () => string) => {
    const hit = src[role];
    if (hit) {
      out[role] = hit.alpha < 1 ? flatten(hit.hex, bg, hit.alpha) : hit.hex;
      return;
    }
    out[role] = fallback();
    derived.push(role);
  };

  take("bg", () => bg);
  take("fg", () => fg);

  // ── ANSI: neutrals, then the six hues, then their bright twins ──
  take("ansiBlack", () => (dark ? mix(bg, fg, 0.1) : mix(bg, fg, 0.86)));
  take("ansiWhite", () => (dark ? mix(bg, fg, 0.82) : mix(bg, fg, 0.35)));
  take("ansiBrightBlack", () => mix(bg, fg, dark ? 0.38 : 0.55));
  take("ansiBrightWhite", () => (dark ? fg : mix(bg, fg, 0.15)));

  /** Editor themes have no ANSI block, but their syntax colors imply one. */
  const hue = (h: number) =>
    oklchToHex({ l: dark ? 0.71 : 0.56, c: 0.12, h });

  take("ansiRed", () => pick("error", "tag") ?? hue(27));
  take("ansiGreen", () => pick("string", "success") ?? hue(148));
  take("ansiYellow", () => pick("warning", "type") ?? hue(90));
  take("ansiBlue", () => pick("function", "info") ?? hue(255));
  take("ansiMagenta", () => pick("keyword") ?? hue(328));
  take("ansiCyan", () => pick("escape", "operator") ?? hue(200));

  for (const name of ["Red", "Green", "Yellow", "Blue", "Magenta", "Cyan"]) {
    const base = out[`ansi${name}` as RoleId];
    take(`ansiBright${name}` as RoleId, () =>
      shift(base, dark ? 0.09 : 0.08, 1.04),
    );
  }

  // ── interface ──
  take("accent", () => pick("cursor") ?? out.ansiBlue);
  const accent = out.accent;

  take("cursor", () => accent);
  take("bgAlt", () => mix(bg, fg, 0.045));
  take("fgDim", () => mix(bg, fg, 0.55));
  take("border", () => mix(bg, fg, dark ? 0.16 : 0.2));
  take("selection", () => mix(bg, accent, dark ? 0.28 : 0.22));
  take("currentLine", () => mix(bg, fg, dark ? 0.06 : 0.05));
  take("lineNumber", () => mix(bg, fg, 0.35));
  take("lineNumberActive", () => mix(bg, fg, 0.8));
  take("matchBg", () => mix(bg, accent, dark ? 0.35 : 0.3));

  // ── syntax, by the base16 convention ──
  // base09 ("orange") has no ANSI slot of its own; it has always been the
  // blend between red and yellow, so numbers and attributes get that.
  const orange = () => mix(out.ansiRed, out.ansiYellow, 0.5);

  take("comment", () => {
    const candidate = out.ansiBrightBlack;
    // A bright-black that vanishes into the canvas makes code unreadable, and
    // plenty of terminal palettes have exactly that. Fall back to a real mix.
    return contrastRatio(candidate, bg) < 1.7 ? mix(bg, fg, 0.5) : candidate;
  });
  take("keyword", () => out.ansiMagenta);
  take("storage", () => shift(out.ansiMagenta, dark ? 0.05 : -0.05, 0.85));
  take("string", () => out.ansiGreen);
  take("escape", () => out.ansiCyan);
  take("number", () => orange());
  take("constant", () => shift(orange(), dark ? 0.04 : -0.04, 1.05));
  take("function", () => out.ansiBlue);
  take("type", () => out.ansiYellow);
  take("variable", () => fg);
  take("parameter", () => mix(fg, out.ansiRed, 0.35));
  take("property", () => mix(out.ansiBlue, fg, 0.25));
  take("operator", () => out.ansiCyan);
  take("punctuation", () => mix(bg, fg, dark ? 0.68 : 0.72));
  take("tag", () => out.ansiRed);
  take("attribute", () => orange());

  // ── diagnostics ──
  take("error", () => out.ansiRed);
  take("warning", () => out.ansiYellow);
  take("info", () => out.ansiBlue);
  take("success", () => out.ansiGreen);

  const name = cleanName(parsed.name) ?? cleanName(fallbackName) ?? "Imported theme";

  // The seed only backs Shuffle and the dark/light flip — the imported colors
  // are what's shown — but it should at least start from this theme's hue.
  const accentLch = hexToOklch(accent);
  const seed: ThemeSeed = {
    name,
    appearance,
    bg: out.bg,
    fg: out.fg,
    hue: accentLch.h,
    scheme: "spectrum",
    chroma: clamp(accentLch.c / 0.125, 0.25, 2),
  };

  if (derived.length) {
    notes.push(
      `${matched.length} of ${ROLE_IDS.length} roles came from the file. The other ${derived.length} were derived from them — every one is editable, and nothing is locked.`,
    );
  } else {
    notes.push("Every role was present in the file. Nothing had to be inferred.");
  }

  return {
    theme: { name, appearance, colors: out, seed },
    report: { format: parsed.format, formatLabel, matched, derived, notes },
  };
}

function cleanName(raw: string | undefined): string | undefined {
  const name = raw
    ?.replace(/^["']|["']$/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return undefined;
  return name.slice(0, 48);
}
