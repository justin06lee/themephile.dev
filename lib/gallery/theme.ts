import { DEFAULT_THEME } from "@/lib/theme/presets";
import { ROLE_IDS, type ColorMap } from "@/lib/theme/roles";
import type { Appearance, Theme, ThemeSeed } from "@/lib/theme/theme";
import { hexToOklch } from "@/lib/color";

export type GalleryTheme = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  appearance: Appearance;
  colors: ColorMap;
  likeCount: number;
  createdAt: string;
  author: { username: string; avatarUrl: string | null };
};

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A stored palette is whatever the roles were on the day it was published.
 * Adding a role later must not turn every existing theme into a black
 * rectangle, so anything missing falls back to the default theme's value.
 */
export function readPalette(stored: unknown): ColorMap {
  const source = (stored ?? {}) as Record<string, unknown>;
  const colors = {} as ColorMap;
  for (const id of ROLE_IDS) {
    const value = source[id];
    colors[id] =
      typeof value === "string" && HEX.test(value)
        ? value.toLowerCase()
        : DEFAULT_THEME.colors[id];
  }
  return colors;
}

/** The palette as it goes into the database: role ids only, nothing else. */
export function writePalette(theme: Theme): Record<string, string> {
  return Object.fromEntries(ROLE_IDS.map((id) => [id, theme.colors[id]]));
}

/**
 * A published theme has no seed — it was stored as 48 finished colors. Rebuild
 * a plausible one so Shuffle and the dark/light flip have somewhere to start
 * once it's open in the editor.
 */
export function toEditorTheme(gallery: GalleryTheme): Theme {
  const accent = hexToOklch(gallery.colors.accent);
  const seed: ThemeSeed = {
    name: gallery.name,
    appearance: gallery.appearance,
    bg: gallery.colors.bg,
    fg: gallery.colors.fg,
    hue: accent.h,
    scheme: "spectrum",
    chroma: Math.min(2, Math.max(0.25, accent.c / 0.125)),
  };
  return {
    name: gallery.name,
    appearance: gallery.appearance,
    colors: gallery.colors,
    seed,
  };
}
