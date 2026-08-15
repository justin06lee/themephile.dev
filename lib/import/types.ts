import type { RoleId } from "@/lib/theme/roles";
import type { Appearance, Theme } from "@/lib/theme/theme";

/**
 * A color as it came out of someone else's file, before we composite it.
 * Alpha is kept because `editor.selectionBackground` is `#rrggbbaa` in almost
 * every VS Code theme, and dropping the channel makes selections look neon.
 */
export type RawColor = { hex: string; alpha: number };

export type PartialColors = Partial<Record<RoleId, RawColor>>;

export type FormatId =
  | "themephile"
  | "vscode"
  | "neovim"
  | "vim"
  | "emacs"
  | "alacritty"
  | "kitty"
  | "ghostty"
  | "wezterm"
  | "windows-terminal"
  | "iterm2"
  | "xresources"
  | "base16"
  | "hex-list";

export type ParseResult = {
  format: FormatId;
  name?: string;
  appearance?: Appearance;
  colors: PartialColors;
  /** Anything worth telling the user about how the read went. */
  notes?: string[];
};

export type Parser = {
  id: FormatId;
  label: string;
  /** What a file of this kind is, for the "detected" line in the dialog. */
  blurb: string;
  /** Cheap sniff. Ordered most-specific-first by the caller. */
  detect: (text: string, filename: string) => boolean;
  parse: (text: string) => ParseResult | null;
};

export type ImportReport = {
  format: FormatId;
  formatLabel: string;
  /** Roles read straight out of the file. */
  matched: RoleId[];
  /** Roles we had to invent, because the file said nothing about them. */
  derived: RoleId[];
  notes: string[];
};

export type ImportOutcome =
  | { ok: true; theme: Theme; report: ImportReport }
  | { ok: false; error: string; hint: string };
