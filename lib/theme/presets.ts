import { deriveTheme, type Theme, type ThemeSeed } from "./theme";

/**
 * Starting points, not destinations. Each one is a seed the generator expands
 * into a full 48-role theme, so every preset is editable down to the token.
 */
export const PRESET_SEEDS: ThemeSeed[] = [
  {
    name: "Nocturne",
    appearance: "dark",
    bg: "#0e1016",
    fg: "#dfe3ec",
    hue: 268,
    scheme: "spectrum",
    chroma: 1,
    blurb: "Deep indigo canvas, full-spectrum syntax. The default for a reason.",
  },
  {
    name: "Ember Room",
    appearance: "dark",
    bg: "#17110e",
    fg: "#f1e4d9",
    hue: 32,
    scheme: "analogous",
    chroma: 1.18,
    blurb: "Firelight. Warm hues clustered tight so nothing shouts.",
  },
  {
    name: "Verdant",
    appearance: "dark",
    bg: "#0b1310",
    fg: "#d9e8dd",
    hue: 152,
    scheme: "split",
    chroma: 0.95,
    blurb: "Moss and lichen, with just enough magenta to find your cursor.",
  },
  {
    name: "Cobalt Drift",
    appearance: "dark",
    bg: "#071120",
    fg: "#d5e4f6",
    hue: 214,
    scheme: "triadic",
    chroma: 1.1,
    blurb: "Cold blue depth. Reads like a screen at 2am, in a good way.",
  },
  {
    name: "Neon Rain",
    appearance: "dark",
    bg: "#06070d",
    fg: "#e8e9f5",
    hue: 305,
    scheme: "complementary",
    chroma: 1.45,
    blurb: "Maximum saturation on near-black. Not subtle. Not trying to be.",
  },
  {
    name: "Graphite",
    appearance: "dark",
    bg: "#131315",
    fg: "#e2e2e4",
    hue: 240,
    scheme: "analogous",
    chroma: 0.22,
    blurb: "Nearly monochrome. For people who think color is a distraction.",
  },
  {
    name: "Vellum",
    appearance: "light",
    bg: "#fbf8f1",
    fg: "#2b2721",
    hue: 28,
    scheme: "spectrum",
    chroma: 0.95,
    blurb: "Warm paper. The light theme that doesn't feel like a hospital.",
  },
  {
    name: "Daylight",
    appearance: "light",
    bg: "#ffffff",
    fg: "#1d222c",
    hue: 222,
    scheme: "split",
    chroma: 1,
    blurb: "Clean white, cool ink. Projector-safe.",
  },
];

export const PRESETS: Theme[] = PRESET_SEEDS.map(deriveTheme);

export const DEFAULT_THEME = PRESETS[0];
