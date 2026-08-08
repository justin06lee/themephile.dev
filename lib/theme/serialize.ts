import { ROLE_IDS, type ColorMap, type RoleId } from "./roles";
import { DEFAULT_THEME } from "./presets";
import type { Appearance, Theme } from "./theme";

/**
 * Themes travel in the URL fragment, never to a server. 48 colors pack into
 * a fixed-order hex run, so a share link stays short enough to paste anywhere.
 */

const VERSION = "1";

function toBase64Url(input: string): string {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return decodeURIComponent(escape(atob(b64 + pad)));
}

export function encodeTheme(theme: Theme): string {
  const hexes = ROLE_IDS.map((id) =>
    (theme.colors[id] ?? "#000000").replace("#", "").padStart(6, "0"),
  ).join("");
  return toBase64Url(
    [VERSION, theme.appearance, theme.name.replace(/\|/g, "/"), hexes].join("|"),
  );
}

export function decodeTheme(encoded: string): Theme | null {
  try {
    const raw = fromBase64Url(encoded);
    const parts = raw.split("|");
    if (parts.length < 4 || parts[0] !== VERSION) return null;

    const appearance = parts[1] === "light" ? "light" : ("dark" as Appearance);
    const name = parts[2] || "Shared theme";
    const hexes = parts[3];
    if (hexes.length < ROLE_IDS.length * 6) return null;

    const colors = {} as ColorMap;
    ROLE_IDS.forEach((id, i) => {
      colors[id] = `#${hexes.slice(i * 6, i * 6 + 6)}`;
    });

    return {
      name,
      appearance,
      colors,
      seed: {
        ...DEFAULT_THEME.seed,
        name,
        appearance,
        bg: colors.bg,
        fg: colors.fg,
      },
    };
  } catch {
    return null;
  }
}

export function shareUrl(theme: Theme, path = "/editor"): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${path}#t=${encodeTheme(theme)}`;
}

/* -------------------------------------------------------------------------- */
/*                              local persistence                             */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "themephile:theme:v1";

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Private browsing, quota, whatever — losing a draft beats crashing.
  }
}

export function loadTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Theme;
    if (!parsed?.colors?.bg) return null;
    // Fill in any role added since the theme was saved.
    const colors = { ...DEFAULT_THEME.colors, ...parsed.colors };
    return { ...parsed, colors };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 file export                                */
/* -------------------------------------------------------------------------- */

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "theme"
  );
}

export function download(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type RoleSnapshot = Record<RoleId, string>;
