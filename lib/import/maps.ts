import {
  CORE_GROUPS,
  NVIM_EXTRA_GROUPS,
  TREESITTER_GROUPS,
  type GroupTable,
} from "@/lib/export/groups";
import type { RoleId } from "@/lib/theme/roles";

/**
 * Reverse lookup tables: someone else's vocabulary back into ours.
 *
 * Each role lists the source keys that can supply it, best first. Importing
 * then means "walk this role's candidates and take the first one the file
 * actually defines", which keeps a theme that only sets `Comment` from being
 * outvoted by a theme that sets `SpecialComment` too.
 */

export type Channel = "fg" | "bg" | "sp";
export type GroupSource = { group: string; channel: Channel };

/**
 * Vim and Neovim groups come from inverting the same tables the exporters
 * write, so our own output round-trips exactly and classic colorschemes —
 * which all speak the `CORE_GROUPS` names — come through nearly whole.
 */
function invert(tables: GroupTable[]): Record<string, GroupSource[]> {
  const out: Record<string, GroupSource[]> = {};
  const push = (role: string, group: string, channel: Channel) => {
    (out[role] ??= []).push({ group, channel });
  };
  for (const table of tables) {
    for (const [group, spec] of table) {
      if (spec.link) continue;
      if (spec.fg) push(spec.fg, group, "fg");
      if (spec.bg) push(spec.bg, group, "bg");
      if (spec.sp) push(spec.sp, group, "sp");
    }
  }
  return out;
}

export const VIM_SOURCES = invert([
  CORE_GROUPS,
  TREESITTER_GROUPS,
  NVIM_EXTRA_GROUPS,
]) as Record<RoleId, GroupSource[]>;

/* -------------------------------------------------------------------------- */
/*                                  VS Code                                   */
/* -------------------------------------------------------------------------- */

/** `colors` keys, best first. */
export const VSCODE_WORKBENCH: Partial<Record<RoleId, string[]>> = {
  bg: ["editor.background", "editorPane.background"],
  bgAlt: [
    "sideBar.background",
    "activityBar.background",
    "editorGroupHeader.tabsBackground",
    "statusBar.background",
    "panel.background",
    "titleBar.activeBackground",
    "editorWidget.background",
  ],
  fg: ["editor.foreground", "foreground"],
  fgDim: [
    "descriptionForeground",
    "tab.inactiveForeground",
    "breadcrumb.foreground",
    "sideBar.foreground",
    "statusBar.foreground",
  ],
  border: [
    "editorGroup.border",
    "panel.border",
    "sideBar.border",
    "widget.border",
    "tab.border",
    "contrastBorder",
  ],
  cursor: ["editorCursor.foreground", "terminalCursor.foreground"],
  selection: ["editor.selectionBackground", "selection.background"],
  currentLine: ["editor.lineHighlightBackground", "editor.lineHighlightBorder"],
  lineNumber: ["editorLineNumber.foreground"],
  lineNumberActive: ["editorLineNumber.activeForeground"],
  accent: [
    "focusBorder",
    "button.background",
    "activityBarBadge.background",
    "badge.background",
    "progressBar.background",
    "textLink.foreground",
    "tab.activeBorderTop",
  ],
  matchBg: ["editor.findMatchBackground", "editor.findMatchHighlightBackground"],
  error: [
    "editorError.foreground",
    "errorForeground",
    "list.errorForeground",
    "editorGutter.deletedBackground",
  ],
  warning: [
    "editorWarning.foreground",
    "list.warningForeground",
    "editorGutter.modifiedBackground",
  ],
  info: ["editorInfo.foreground", "editorHint.foreground", "textLink.foreground"],
  success: [
    "editorGutter.addedBackground",
    "gitDecoration.addedResourceForeground",
  ],
  ansiBlack: ["terminal.ansiBlack"],
  ansiRed: ["terminal.ansiRed"],
  ansiGreen: ["terminal.ansiGreen"],
  ansiYellow: ["terminal.ansiYellow"],
  ansiBlue: ["terminal.ansiBlue"],
  ansiMagenta: ["terminal.ansiMagenta"],
  ansiCyan: ["terminal.ansiCyan"],
  ansiWhite: ["terminal.ansiWhite"],
  ansiBrightBlack: ["terminal.ansiBrightBlack"],
  ansiBrightRed: ["terminal.ansiBrightRed"],
  ansiBrightGreen: ["terminal.ansiBrightGreen"],
  ansiBrightYellow: ["terminal.ansiBrightYellow"],
  ansiBrightBlue: ["terminal.ansiBrightBlue"],
  ansiBrightMagenta: ["terminal.ansiBrightMagenta"],
  ansiBrightCyan: ["terminal.ansiBrightCyan"],
  ansiBrightWhite: ["terminal.ansiBrightWhite"],
};

/**
 * TextMate scopes, best first. Matching is bidirectional on dots, so our
 * `comment` finds a rule scoped `comment.line.double-slash` and vice versa.
 */
export const VSCODE_SCOPES: Partial<Record<RoleId, string[]>> = {
  comment: ["comment"],
  keyword: ["keyword.control", "keyword"],
  storage: ["storage.type", "storage.modifier", "storage", "keyword.declaration"],
  string: ["string.quoted", "string"],
  escape: ["constant.character.escape", "string.regexp", "constant.regexp"],
  number: ["constant.numeric"],
  constant: ["constant.language", "variable.other.constant", "support.constant"],
  function: ["entity.name.function", "support.function", "meta.function-call"],
  type: [
    "entity.name.type",
    "entity.name.class",
    "support.type",
    "support.class",
    "entity.other.inherited-class",
  ],
  variable: ["variable.other.readwrite", "variable"],
  parameter: ["variable.parameter", "meta.parameter"],
  property: [
    "variable.other.property",
    "support.type.property-name",
    "meta.object-literal.key",
    "variable.other.object.property",
  ],
  operator: ["keyword.operator"],
  punctuation: ["punctuation.definition", "punctuation", "meta.brace"],
  tag: ["entity.name.tag"],
  attribute: ["entity.other.attribute-name", "meta.decorator"],
};

/** `semanticTokenColors` keys, which are cleaner than scopes when present. */
export const VSCODE_SEMANTIC: Partial<Record<RoleId, string[]>> = {
  keyword: ["keyword"],
  storage: ["modifier"],
  string: ["string"],
  number: ["number"],
  constant: ["enumMember", "variable.readonly"],
  function: ["function", "method"],
  type: ["class", "interface", "type", "enum", "struct", "namespace"],
  variable: ["variable"],
  parameter: ["parameter"],
  property: ["property"],
  operator: ["operator"],
  comment: ["comment"],
  attribute: ["decorator", "macro"],
};

/* -------------------------------------------------------------------------- */
/*                                   Emacs                                    */
/* -------------------------------------------------------------------------- */

export const EMACS_FACES: Partial<Record<RoleId, GroupSource[]>> = {
  bg: [{ group: "default", channel: "bg" }],
  fg: [{ group: "default", channel: "fg" }],
  bgAlt: [
    { group: "mode-line", channel: "bg" },
    { group: "header-line", channel: "bg" },
    { group: "tooltip", channel: "bg" },
  ],
  fgDim: [
    { group: "shadow", channel: "fg" },
    { group: "mode-line-inactive", channel: "fg" },
  ],
  border: [
    { group: "vertical-border", channel: "fg" },
    { group: "window-divider", channel: "fg" },
    { group: "fill-column-indicator", channel: "fg" },
  ],
  cursor: [
    { group: "cursor", channel: "bg" },
    { group: "cursor", channel: "fg" },
  ],
  selection: [{ group: "region", channel: "bg" }],
  currentLine: [
    { group: "hl-line", channel: "bg" },
    { group: "highlight", channel: "bg" },
  ],
  lineNumber: [
    { group: "line-number", channel: "fg" },
    { group: "linum", channel: "fg" },
    { group: "fringe", channel: "fg" },
  ],
  lineNumberActive: [{ group: "line-number-current-line", channel: "fg" }],
  accent: [
    { group: "minibuffer-prompt", channel: "fg" },
    { group: "mode-line-buffer-id", channel: "fg" },
    { group: "isearch", channel: "bg" },
  ],
  matchBg: [
    { group: "lazy-highlight", channel: "bg" },
    { group: "match", channel: "bg" },
    { group: "secondary-selection", channel: "bg" },
  ],
  comment: [
    { group: "font-lock-comment-face", channel: "fg" },
    { group: "font-lock-doc-face", channel: "fg" },
  ],
  keyword: [{ group: "font-lock-keyword-face", channel: "fg" }],
  storage: [{ group: "font-lock-builtin-face", channel: "fg" }],
  string: [{ group: "font-lock-string-face", channel: "fg" }],
  escape: [
    { group: "font-lock-escape-face", channel: "fg" },
    { group: "font-lock-regexp-grouping-backslash", channel: "fg" },
  ],
  number: [{ group: "font-lock-number-face", channel: "fg" }],
  constant: [{ group: "font-lock-constant-face", channel: "fg" }],
  function: [
    { group: "font-lock-function-name-face", channel: "fg" },
    { group: "font-lock-function-call-face", channel: "fg" },
  ],
  type: [{ group: "font-lock-type-face", channel: "fg" }],
  variable: [{ group: "font-lock-variable-name-face", channel: "fg" }],
  property: [{ group: "font-lock-property-name-face", channel: "fg" }],
  operator: [
    { group: "font-lock-operator-face", channel: "fg" },
    { group: "font-lock-negation-char-face", channel: "fg" },
  ],
  punctuation: [
    { group: "font-lock-punctuation-face", channel: "fg" },
    { group: "font-lock-delimiter-face", channel: "fg" },
    { group: "font-lock-bracket-face", channel: "fg" },
  ],
  attribute: [{ group: "font-lock-preprocessor-face", channel: "fg" }],
  error: [
    { group: "error", channel: "fg" },
    { group: "font-lock-warning-face", channel: "fg" },
  ],
  warning: [{ group: "warning", channel: "fg" }],
  success: [{ group: "success", channel: "fg" }],
  info: [{ group: "link", channel: "fg" }],
};

/* -------------------------------------------------------------------------- */
/*                                   base16                                   */
/* -------------------------------------------------------------------------- */

/**
 * The base16 styling guideline, which every base16 scheme is authored against.
 * base08..base0F are the eight accents, and their meanings are fixed — that's
 * the whole point of the standard, and it's why a base16 file converts into a
 * genuinely good editor theme rather than a guess.
 */
export const BASE16_ROLES: Partial<Record<RoleId, string>> = {
  bg: "base00",
  bgAlt: "base01",
  currentLine: "base01",
  selection: "base02",
  comment: "base03",
  lineNumber: "base03",
  fgDim: "base04",
  fg: "base05",
  border: "base02",

  variable: "base08",
  tag: "base08",
  error: "base08",
  number: "base09",
  constant: "base09",
  attribute: "base09",
  type: "base0A",
  warning: "base0A",
  string: "base0B",
  success: "base0B",
  escape: "base0C",
  operator: "base0C",
  function: "base0D",
  accent: "base0D",
  info: "base0D",
  property: "base0D",
  keyword: "base0E",
  storage: "base0E",

  ansiBlack: "base00",
  ansiRed: "base08",
  ansiGreen: "base0B",
  ansiYellow: "base0A",
  ansiBlue: "base0D",
  ansiMagenta: "base0E",
  ansiCyan: "base0C",
  ansiWhite: "base05",
  ansiBrightBlack: "base03",
  ansiBrightRed: "base08",
  ansiBrightGreen: "base0B",
  ansiBrightYellow: "base0A",
  ansiBrightBlue: "base0D",
  ansiBrightMagenta: "base0E",
  ansiBrightCyan: "base0C",
  ansiBrightWhite: "base07",
};

/** base24 extends base16 with real bright colors, so prefer them when present. */
export const BASE24_BRIGHTS: Partial<Record<RoleId, string>> = {
  ansiBrightRed: "base12",
  ansiBrightGreen: "base14",
  ansiBrightYellow: "base13",
  ansiBrightBlue: "base16",
  ansiBrightMagenta: "base17",
  ansiBrightCyan: "base15",
};

/** ANSI names as terminals spell them, in wire order. */
export const ANSI_NAMES: RoleId[] = [
  "ansiBlack",
  "ansiRed",
  "ansiGreen",
  "ansiYellow",
  "ansiBlue",
  "ansiMagenta",
  "ansiCyan",
  "ansiWhite",
  "ansiBrightBlack",
  "ansiBrightRed",
  "ansiBrightGreen",
  "ansiBrightYellow",
  "ansiBrightBlue",
  "ansiBrightMagenta",
  "ansiBrightCyan",
  "ansiBrightWhite",
];
