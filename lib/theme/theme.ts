import {
  contrastRatio,
  harmonyHues,
  hexToOklch,
  mix,
  oklchToHex,
  type HarmonyScheme,
} from "@/lib/color";
import { ROLE_IDS, type ColorMap, type RoleId } from "./roles";

export type Appearance = "dark" | "light";

/**
 * A seed is the handful of decisions that actually define a theme's character.
 * Everything else — 48 role colors — is derived from it, which is what makes
 * "randomize" produce coherent themes instead of confetti.
 */
export type ThemeSeed = {
  name: string;
  appearance: Appearance;
  /** Editor background. */
  bg: string;
  /** Default text color. */
  fg: string;
  /** Where the palette's hue wheel starts. 0..360 */
  hue: number;
  scheme: HarmonyScheme;
  /** Global saturation multiplier. 1 is "normal", 0.2 is near-grayscale. */
  chroma: number;
  blurb?: string;
};

export type Theme = {
  name: string;
  appearance: Appearance;
  colors: ColorMap;
  /** Kept so the inspector can offer "revert this role to its derived value". */
  seed: ThemeSeed;
};

type Recipe = {
  /** Index into the 8 derived hues. */
  slot: number;
  /** Lightness offset from the palette base. */
  dl?: number;
  /** Chroma multiplier. */
  cf?: number;
};

/**
 * Which hue slot each syntax role draws from. Roles that belong together
 * (keyword/storage, number/constant) share a slot so the result reads as a
 * language, not a bag of colors.
 */
const SYNTAX_RECIPE: Record<string, Recipe> = {
  keyword: { slot: 4 },
  storage: { slot: 4, dl: 0.05, cf: 0.85 },
  string: { slot: 2, dl: 0.01 },
  escape: { slot: 1, dl: 0.06, cf: 1.1 },
  number: { slot: 1 },
  constant: { slot: 1, dl: 0.04, cf: 1.05 },
  function: { slot: 5, dl: 0.06 },
  type: { slot: 6, dl: 0.03 },
  parameter: { slot: 7, dl: 0.02, cf: 0.7 },
  property: { slot: 5, dl: 0.11, cf: 0.6 },
  operator: { slot: 3, cf: 0.65 },
  tag: { slot: 0 },
  attribute: { slot: 3, dl: 0.04 },
};

/** Diagnostics keep recognizable hues no matter what the palette is doing. */
const DIAGNOSTIC_HUES: Record<string, number> = {
  error: 25,
  warning: 80,
  info: 250,
  success: 150,
};

const ANSI_HUES: [RoleId, number][] = [
  ["ansiRed", 27],
  ["ansiGreen", 148],
  ["ansiYellow", 90],
  ["ansiBlue", 255],
  ["ansiMagenta", 328],
  ["ansiCyan", 200],
];

export function deriveTheme(seed: ThemeSeed): Theme {
  const dark = seed.appearance === "dark";
  const { bg, fg } = seed;

  // Base lightness for colored ink. Dark themes want bright syntax; light
  // themes want syntax dark enough to read on paper-white.
  const baseL = dark ? 0.79 : 0.52;
  const baseC = (dark ? 0.125 : 0.14) * seed.chroma;
  const hues = harmonyHues(seed.hue, 8, seed.scheme);

  const ink = (r: Recipe): string =>
    oklchToHex({
      l: clamp01(baseL + (r.dl ?? 0)),
      c: Math.max(0, baseC * (r.cf ?? 1)),
      h: hues[r.slot % hues.length],
    });

  const accent = ink({ slot: 0, dl: dark ? 0.02 : -0.02, cf: 1.15 });

  const colors: Partial<ColorMap> = {
    // ── surface ──
    bg,
    bgAlt: mix(bg, fg, dark ? 0.045 : 0.045),
    fg,
    fgDim: mix(bg, fg, 0.55),
    border: mix(bg, fg, dark ? 0.16 : 0.2),
    cursor: accent,
    selection: mix(bg, accent, dark ? 0.28 : 0.22),
    currentLine: mix(bg, fg, dark ? 0.06 : 0.05),
    lineNumber: mix(bg, fg, 0.35),
    lineNumberActive: mix(bg, fg, 0.8),
    accent,
    matchBg: mix(bg, ink({ slot: 3, cf: 1.2 }), dark ? 0.35 : 0.3),

    // ── syntax ──
    comment: mix(
      bg,
      oklchToHex({ l: baseL, c: baseC * 0.35, h: hues[6] }),
      dark ? 0.52 : 0.62,
    ),
    variable: mix(fg, oklchToHex({ l: baseL, c: baseC, h: hues[7] }), 0.18),
    punctuation: mix(bg, fg, dark ? 0.68 : 0.72),
  };

  for (const [id, recipe] of Object.entries(SYNTAX_RECIPE)) {
    colors[id as RoleId] = ink(recipe);
  }

  for (const [id, hue] of Object.entries(DIAGNOSTIC_HUES)) {
    colors[id as RoleId] = oklchToHex({
      l: dark ? 0.72 : 0.55,
      c: Math.max(0.09, baseC * 1.2),
      h: hue,
    });
  }

  // ── ANSI 16 ──
  colors.ansiBlack = dark ? mix(bg, fg, 0.1) : mix(bg, fg, 0.86);
  colors.ansiWhite = dark ? mix(bg, fg, 0.82) : mix(bg, fg, 0.35);
  colors.ansiBrightBlack = dark ? mix(bg, fg, 0.38) : mix(bg, fg, 0.55);
  colors.ansiBrightWhite = dark ? fg : mix(bg, fg, 0.15);

  for (const [id, hue] of ANSI_HUES) {
    const c = Math.max(0.1, baseC * 1.05);
    colors[id] = oklchToHex({ l: dark ? 0.71 : 0.56, c, h: hue });
    const brightId = ("ansiBright" +
      id.slice(4, 5).toUpperCase() +
      id.slice(5)) as RoleId;
    colors[brightId] = oklchToHex({
      l: dark ? 0.82 : 0.66,
      c: c * 1.05,
      h: hue,
    });
  }

  return { name: seed.name, appearance: seed.appearance, colors: colors as ColorMap, seed };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* -------------------------------------------------------------------------- */
/*                                 randomizing                                */
/* -------------------------------------------------------------------------- */

const SCHEMES: HarmonyScheme[] = [
  "spectrum",
  "analogous",
  "complementary",
  "triadic",
  "split",
];

const ADJECTIVES = [
  "Velvet", "Quiet", "Copper", "Glass", "Drift", "Ember", "Static", "Hollow",
  "Neon", "Paper", "Slate", "Aurora", "Dusk", "Signal", "Marble", "Fathom",
  "Lantern", "Cinder", "Frost", "Mercury",
];
const NOUNS = [
  "Harbor", "Circuit", "Meadow", "Reef", "Vault", "Grove", "Cassette", "Atlas",
  "Prism", "Tide", "Orbit", "Canvas", "Foundry", "Lattice", "Beacon", "Aperture",
];

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function randomSeed(appearance?: Appearance): ThemeSeed {
  const dark = appearance ? appearance === "dark" : Math.random() > 0.3;
  const hue = Math.floor(Math.random() * 360);
  // Tint the background slightly toward the palette hue — pure #000 reads cheap.
  const bgHue = (hue + (Math.random() * 80 - 40) + 360) % 360;

  const bg = dark
    ? oklchToHex({ l: 0.14 + Math.random() * 0.07, c: 0.008 + Math.random() * 0.022, h: bgHue })
    : oklchToHex({ l: 0.965 + Math.random() * 0.03, c: 0.004 + Math.random() * 0.014, h: bgHue });

  const fg = dark
    ? oklchToHex({ l: 0.9 + Math.random() * 0.05, c: 0.012, h: bgHue })
    : oklchToHex({ l: 0.28 + Math.random() * 0.08, c: 0.018, h: bgHue });

  return {
    name: `${pick(ADJECTIVES)} ${pick(NOUNS)}`,
    appearance: dark ? "dark" : "light",
    bg,
    fg,
    hue,
    scheme: pick(SCHEMES),
    chroma: 0.7 + Math.random() * 0.75,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Flip a seed between dark and light, keeping its hue character. The generator
 * handles the rest — syntax lightness inverts on its own.
 */
export function withAppearance(seed: ThemeSeed, appearance: Appearance): ThemeSeed {
  if (seed.appearance === appearance) return seed;
  const bg = hexToOklch(seed.bg);
  const fg = hexToOklch(seed.fg);
  const dark = appearance === "dark";
  return {
    ...seed,
    appearance,
    bg: oklchToHex({ ...bg, l: dark ? 0.17 : 0.97, c: Math.min(bg.c, 0.02) }),
    fg: oklchToHex({ ...fg, l: dark ? 0.92 : 0.3 }),
  };
}

export function cloneTheme(theme: Theme): Theme {
  return { ...theme, colors: { ...theme.colors }, seed: { ...theme.seed } };
}

export function setColor(theme: Theme, role: RoleId, hex: string): Theme {
  return { ...theme, colors: { ...theme.colors, [role]: hex }, seed: { ...theme.seed } };
}

/** Roles whose contrast against the editor background is worth policing. */
const CONTRAST_EXEMPT = new Set<RoleId>([
  "bg",
  "bgAlt",
  "selection",
  "currentLine",
  "matchBg",
  "border",
  "ansiBlack",
  "ansiBrightBlack",
]);

export type ContrastReport = { role: RoleId; ratio: number }[];

/** Every ink role that fails WCAG AA-large against the canvas, worst first. */
export function lowContrastRoles(theme: Theme): ContrastReport {
  const bg = theme.colors.bg;
  return ROLE_IDS.filter((id) => !CONTRAST_EXEMPT.has(id))
    .map((role) => ({ role, ratio: contrastRatio(theme.colors[role], bg) }))
    .filter((r) => r.ratio < 3)
    .sort((a, b) => a.ratio - b.ratio);
}

/**
 * Nudge every failing role's lightness away from the background until it
 * clears AA-large. Hue and chroma are preserved, so the theme keeps its look.
 */
export function boostContrast(theme: Theme, target = 4.0): Theme {
  const bg = theme.colors.bg;
  const dark = theme.appearance === "dark";
  const colors = { ...theme.colors };

  for (const id of ROLE_IDS) {
    if (CONTRAST_EXEMPT.has(id)) continue;
    let c = hexToOklch(colors[id]);
    for (let i = 0; i < 40 && contrastRatio(oklchToHex(c), bg) < target; i++) {
      const next = clamp01(c.l + (dark ? 0.015 : -0.015));
      if (next === c.l) break;
      c = { ...c, l: next };
    }
    colors[id] = oklchToHex(c);
  }
  return { ...theme, colors };
}
