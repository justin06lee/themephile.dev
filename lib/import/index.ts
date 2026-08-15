import { emacsParser, neovimParser, vimParser, vscodeParser } from "./editors";
import { base16Parser, hexListParser, themephileParser } from "./palettes";
import { completeTheme } from "./complete";
import { scrapeHexes } from "./scan";
import {
  alacrittyParser,
  ghosttyParser,
  itermParser,
  kittyParser,
  weztermParser,
  windowsTerminalParser,
  xresourcesParser,
} from "./terminals";
import type { FormatId, ImportOutcome, Parser } from "./types";

/**
 * Order is the whole algorithm. Detection is deliberately optimistic — a
 * format that half-matches still has to survive its own parser returning
 * something — so the specific formats have to be asked before the vague ones,
 * ending at the catch-all that just scrapes hex codes.
 */
export const PARSERS: Parser[] = [
  themephileParser,
  vscodeParser,
  windowsTerminalParser,
  itermParser,
  base16Parser,
  emacsParser,
  neovimParser,
  vimParser,
  alacrittyParser,
  ghosttyParser,
  kittyParser,
  weztermParser,
  xresourcesParser,
  hexListParser,
];

export const PARSER_BY_ID = Object.fromEntries(
  PARSERS.map((p) => [p.id, p]),
) as Record<FormatId, Parser>;

/** Extensions people actually have these files under. */
const BY_EXTENSION: [RegExp, FormatId][] = [
  [/\.itermcolors$/i, "iterm2"],
  [/\.el$/i, "emacs"],
  [/\.vim$/i, "vim"],
  [/\.lua$/i, "neovim"],
  [/\.toml$/i, "alacritty"],
  [/xresources|xdefaults/i, "xresources"],
  [/\.ya?ml$/i, "base16"],
];

function hintedOrder(filename: string): Parser[] {
  const hint = BY_EXTENSION.find(([re]) => re.test(filename))?.[1];
  if (!hint) return PARSERS;
  // A hint only promotes; it never removes a candidate, because a `.lua` file
  // is just as likely to be a WezTerm scheme as a Neovim one.
  return [PARSER_BY_ID[hint], ...PARSERS.filter((p) => p.id !== hint)];
}

/** What the file looks like, without committing to reading it. */
export function detectFormat(text: string, filename = ""): Parser | null {
  if (!text.trim()) return null;
  for (const parser of hintedOrder(filename)) {
    if (parser.id !== "hex-list" && parser.detect(text, filename)) return parser;
  }
  return scrapeHexes(text).length >= 3 ? hexListParser : null;
}

/** Guards against someone pasting a whole repository into the box. */
const MAX_INPUT = 2_000_000;

export function importTheme(text: string, filename = ""): ImportOutcome {
  if (!text.trim()) {
    return {
      ok: false,
      error: "Nothing to read",
      hint: "Paste a theme file, or drop one in.",
    };
  }
  if (text.length > MAX_INPUT) {
    return {
      ok: false,
      error: "That file is too big to be a theme",
      hint: `It's ${(text.length / 1_000_000).toFixed(1)} MB. Theme files are a few kilobytes — this looks like something else.`,
    };
  }

  for (const parser of hintedOrder(filename)) {
    if (!parser.detect(text, filename)) continue;
    const parsed = parser.parse(text);
    if (!parsed || Object.keys(parsed.colors).length < 2) continue;

    const stem = filename.replace(/\.[^.]+$/, "").replace(/-(theme|colors?)$/i, "");
    return { ok: true, ...completeTheme(parsed, stem, parser.label) };
  }

  const found = scrapeHexes(text).length;
  return {
    ok: false,
    error: found ? "Couldn't make a theme out of that" : "No colors in there",
    hint: found
      ? `There are ${found} colors in the text but nothing recognizable around them — a couple more and they'd be read as a loose palette.`
      : "Nothing in the text looks like a hex color. Check you copied the whole file.",
  };
}

export type { ImportOutcome, ImportReport, FormatId } from "./types";
