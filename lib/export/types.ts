import type { Theme } from "@/lib/theme/theme";

export type ExportFile = {
  filename: string;
  /** Used for the preview's own syntax highlighting and the copy label. */
  language: "json" | "lua" | "vim" | "elisp" | "toml" | "conf" | "ini";
  contents: string;
};

export type ExportTarget = {
  id: string;
  label: string;
  /** Family, for grouping the tabs. */
  family: "editor" | "terminal" | "raw";
  blurb: string;
  files: (theme: Theme) => ExportFile[];
  /** Where it goes and what to type. Rendered as an ordered list. */
  install: (theme: Theme) => string[];
};

/** Append an 8-bit alpha channel to a `#rrggbb`. */
export const alpha = (hex: string, a: number): string =>
  hex +
  Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
