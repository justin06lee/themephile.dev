/**
 * Color math. Everything the editor does perceptually — deriving palettes,
 * nudging lightness, checking contrast — runs through OKLab/OKLCh, because
 * "10% lighter" in HSL is a lie that varies wildly by hue.
 */

export type RGB = { r: number; g: number; b: number }; // 0..1
export type OKLCH = { l: number; c: number; h: number }; // l 0..1, c 0..~0.4, h 0..360
export type HSL = { h: number; s: number; l: number }; // h 0..360, s/l 0..1

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/* -------------------------------------------------------------------------- */
/*                                  hex <-> rgb                               */
/* -------------------------------------------------------------------------- */

export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length === 8) h = h.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
  const n = parseInt(h, 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

const toHex2 = (v: number) =>
  Math.round(clamp(v) * 255)
    .toString(16)
    .padStart(2, "0");

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}

export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  return rgbToHex(hexToRgb(hex));
}

/* -------------------------------------------------------------------------- */
/*                                sRGB <-> OKLab                              */
/* -------------------------------------------------------------------------- */

const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const linearToSrgb = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

function rgbToOklab({ r, g, b }: RGB) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToRgb({ L, a, b }: { L: number; a: number; b: number }): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: clamp(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  };
}

/* -------------------------------------------------------------------------- */
/*                                    OKLCh                                   */
/* -------------------------------------------------------------------------- */

export function rgbToOklch(rgb: RGB): OKLCH {
  const { L, a, b } = rgbToOklab(rgb);
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export function oklchToRgb({ l, c, h }: OKLCH): RGB {
  const rad = (h * Math.PI) / 180;
  return oklabToRgb({ L: l, a: Math.cos(rad) * c, b: Math.sin(rad) * c });
}

export const hexToOklch = (hex: string) => rgbToOklch(hexToRgb(hex));

/**
 * OKLCh -> hex, reducing chroma until the color actually fits in sRGB.
 * Naive clamping of out-of-gamut values shifts hue; walking chroma down
 * keeps the hue and lightness the caller asked for.
 */
export function oklchToHex({ l, c, h }: OKLCH): string {
  const L = clamp(l);
  let chroma = Math.max(0, c);
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToRgb({ l: L, c: chroma, h });
    const back = rgbToOklch(rgb);
    // If the round trip preserved lightness and chroma, we're inside the gamut.
    if (Math.abs(back.l - L) < 0.005 && Math.abs(back.c - chroma) < 0.005) {
      return rgbToHex(rgb);
    }
    chroma *= 0.9;
  }
  return rgbToHex(oklchToRgb({ l: L, c: 0, h }));
}

/* -------------------------------------------------------------------------- */
/*                                 hex <-> HSL                                */
/* -------------------------------------------------------------------------- */

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return rgbToHex({ r: rgb[0] + m, g: rgb[1] + m, b: rgb[2] + m });
}

/* -------------------------------------------------------------------------- */
/*                                 hex <-> HSV                                */
/* -------------------------------------------------------------------------- */

export type HSV = { h: number; s: number; v: number };

/** HSV is what a saturation/value square actually maps to. */
export function hexToHsv(hex: string): HSV {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v: max };
}

export function hsvToHex({ h, s, v }: HSV): string {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = v - c;
  return rgbToHex({ r: rgb[0] + m, g: rgb[1] + m, b: rgb[2] + m });
}

/* -------------------------------------------------------------------------- */
/*                          manipulation & measurement                        */
/* -------------------------------------------------------------------------- */

/** Move a color along the OKLCh lightness axis. `amount` is absolute (0..1). */
export function lighten(hex: string, amount: number): string {
  const c = hexToOklch(hex);
  return oklchToHex({ ...c, l: clamp(c.l + amount) });
}

export const darken = (hex: string, amount: number) => lighten(hex, -amount);

/** Scale chroma (saturation-ish) while holding lightness and hue. */
export function saturate(hex: string, factor: number): string {
  const c = hexToOklch(hex);
  return oklchToHex({ ...c, c: Math.max(0, c.c * factor) });
}

export function withHue(hex: string, hue: number): string {
  const c = hexToOklch(hex);
  return oklchToHex({ ...c, h: ((hue % 360) + 360) % 360 });
}

/** Perceptual blend. `t` is how much of `b` ends up in the result. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToOklch(a);
  const B = hexToOklch(b);
  // Interpolate hue the short way around the wheel.
  let dh = B.h - A.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return oklchToHex({
    l: A.l + (B.l - A.l) * t,
    c: A.c + (B.c - A.c) * t,
    h: A.h + dh * t,
  });
}

/** Flatten a translucent color over an opaque one, for previewing alpha. */
export function flatten(fg: string, bg: string, alpha: number): string {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  return rgbToHex({
    r: f.r * alpha + b.r * (1 - alpha),
    g: f.g * alpha + b.g * (1 - alpha),
    b: f.b * alpha + b.b * (1 - alpha),
  });
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

/** WCAG 2.1 contrast ratio, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastGrade = "AAA" | "AA" | "AA Large" | "Fail";

export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export const isLight = (hex: string) => relativeLuminance(hex) > 0.36;

/** Black or white, whichever is readable on `bg`. Used for swatch labels. */
export const readableOn = (bg: string) => (isLight(bg) ? "#000000" : "#ffffff");

/* -------------------------------------------------------------------------- */
/*                           terminal color approximation                     */
/* -------------------------------------------------------------------------- */

const ANSI_256_CUBE = [0, 95, 135, 175, 215, 255];

/** Nearest xterm-256 index — Vim's `ctermfg` and tmux's `colour…` need one. */
export function nearestXterm256(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const target = { r: r * 255, g: g * 255, b: b * 255 };

  let best = 16;
  let bestDist = Infinity;

  const consider = (idx: number, cr: number, cg: number, cb: number) => {
    // Weighted RGB distance — cheap, and close enough for a terminal fallback.
    const d =
      2 * (cr - target.r) ** 2 + 4 * (cg - target.g) ** 2 + 3 * (cb - target.b) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  };

  for (let ri = 0; ri < 6; ri++) {
    for (let gi = 0; gi < 6; gi++) {
      for (let bi = 0; bi < 6; bi++) {
        consider(
          16 + 36 * ri + 6 * gi + bi,
          ANSI_256_CUBE[ri],
          ANSI_256_CUBE[gi],
          ANSI_256_CUBE[bi],
        );
      }
    }
  }
  for (let i = 0; i < 24; i++) {
    const v = 8 + i * 10;
    consider(232 + i, v, v, v);
  }
  return best;
}

/* -------------------------------------------------------------------------- */
/*                                   harmony                                  */
/* -------------------------------------------------------------------------- */

/**
 * Spread `count` hues around a base. Scheme controls how far apart they sit —
 * "analogous" stays in a neighborhood, "spectrum" walks the whole wheel.
 */
export type HarmonyScheme =
  | "spectrum"
  | "analogous"
  | "complementary"
  | "triadic"
  | "split";

export function harmonyHues(
  base: number,
  count: number,
  scheme: HarmonyScheme,
): number[] {
  const wrap = (h: number) => ((h % 360) + 360) % 360;
  switch (scheme) {
    case "analogous": {
      // Wide enough that eight slots stay distinguishable, tight enough that
      // the palette still reads as one family.
      const span = 140;
      return Array.from({ length: count }, (_, i) =>
        wrap(base - span / 2 + (span * i) / Math.max(1, count - 1)),
      );
    }
    case "complementary": {
      return Array.from({ length: count }, (_, i) =>
        wrap(base + (i % 2 === 0 ? 0 : 180) + Math.floor(i / 2) * 18 - 18),
      );
    }
    case "triadic": {
      return Array.from({ length: count }, (_, i) =>
        wrap(base + (i % 3) * 120 + Math.floor(i / 3) * 16),
      );
    }
    case "split": {
      const offsets = [0, 150, 210, 30, 330, 180, 90, 270];
      return Array.from({ length: count }, (_, i) => wrap(base + offsets[i % offsets.length]));
    }
    case "spectrum":
    default:
      return Array.from({ length: count }, (_, i) => wrap(base + (360 * i) / count));
  }
}
