/**
 * The role vocabulary. Every editor calls these things something different —
 * VS Code has TextMate scopes, Neovim has treesitter captures, Emacs has
 * font-lock faces. A role is the neutral middle that all exporters translate
 * from, so you pick a color once and it lands everywhere.
 */

export type RoleGroup = "ui" | "syntax" | "diagnostic" | "ansi";

export type Role = {
  id: string;
  label: string;
  group: RoleGroup;
  /** Shown in the inspector so it's obvious what you're about to change. */
  hint: string;
  /** Roles that read as a background rather than as ink. */
  surface?: boolean;
};

export const ROLES = [
  // ── Editor surface ──────────────────────────────────────────────────────
  { id: "bg", label: "Background", group: "ui", hint: "The editor canvas", surface: true },
  { id: "bgAlt", label: "Panel", group: "ui", hint: "Sidebar, status line, tab bar", surface: true },
  { id: "fg", label: "Foreground", group: "ui", hint: "Default text with no other rule", },
  { id: "fgDim", label: "Dim text", group: "ui", hint: "Inactive tabs, breadcrumbs, hints" },
  { id: "border", label: "Border", group: "ui", hint: "Splits, panel edges, window separators" },
  { id: "cursor", label: "Cursor", group: "ui", hint: "Caret color" },
  { id: "selection", label: "Selection", group: "ui", hint: "Selected text background", surface: true },
  { id: "currentLine", label: "Current line", group: "ui", hint: "Cursor line highlight", surface: true },
  { id: "lineNumber", label: "Line number", group: "ui", hint: "Gutter digits" },
  { id: "lineNumberActive", label: "Active line no.", group: "ui", hint: "Gutter digit on the cursor line" },
  { id: "accent", label: "Accent", group: "ui", hint: "Focus rings, active tab underline, matches" },
  { id: "matchBg", label: "Search match", group: "ui", hint: "Search / bracket match background", surface: true },

  // ── Syntax ──────────────────────────────────────────────────────────────
  { id: "comment", label: "Comment", group: "syntax", hint: "// notes and docblocks" },
  { id: "keyword", label: "Keyword", group: "syntax", hint: "if, return, import, await" },
  { id: "storage", label: "Storage", group: "syntax", hint: "const, class, def, func, struct" },
  { id: "string", label: "String", group: "syntax", hint: "Quoted text and template literals" },
  { id: "escape", label: "Escape / regex", group: "syntax", hint: "\\n, ${…}, regex literals" },
  { id: "number", label: "Number", group: "syntax", hint: "Numeric literals" },
  { id: "constant", label: "Constant", group: "syntax", hint: "true, false, nil, SCREAMING_CASE" },
  { id: "function", label: "Function", group: "syntax", hint: "Declarations and call sites" },
  { id: "type", label: "Type", group: "syntax", hint: "Classes, interfaces, type names" },
  { id: "variable", label: "Variable", group: "syntax", hint: "Plain identifiers" },
  { id: "parameter", label: "Parameter", group: "syntax", hint: "Function arguments" },
  { id: "property", label: "Property", group: "syntax", hint: "obj.field and object keys" },
  { id: "operator", label: "Operator", group: "syntax", hint: "+, =>, ===, |>" },
  { id: "punctuation", label: "Punctuation", group: "syntax", hint: "Brackets, commas, semicolons" },
  { id: "tag", label: "Tag", group: "syntax", hint: "HTML / JSX element names" },
  { id: "attribute", label: "Attribute", group: "syntax", hint: "Markup attributes and decorators" },

  // ── Diagnostics ─────────────────────────────────────────────────────────
  { id: "error", label: "Error", group: "diagnostic", hint: "Errors, deletions, failing tests" },
  { id: "warning", label: "Warning", group: "diagnostic", hint: "Warnings and modified lines" },
  { id: "info", label: "Info", group: "diagnostic", hint: "Hints, info diagnostics" },
  { id: "success", label: "Success", group: "diagnostic", hint: "Additions, passing tests" },

  // ── ANSI (terminal, tmux, and the integrated terminal) ──────────────────
  { id: "ansiBlack", label: "black", group: "ansi", hint: "ANSI 0" },
  { id: "ansiRed", label: "red", group: "ansi", hint: "ANSI 1" },
  { id: "ansiGreen", label: "green", group: "ansi", hint: "ANSI 2" },
  { id: "ansiYellow", label: "yellow", group: "ansi", hint: "ANSI 3" },
  { id: "ansiBlue", label: "blue", group: "ansi", hint: "ANSI 4" },
  { id: "ansiMagenta", label: "magenta", group: "ansi", hint: "ANSI 5" },
  { id: "ansiCyan", label: "cyan", group: "ansi", hint: "ANSI 6" },
  { id: "ansiWhite", label: "white", group: "ansi", hint: "ANSI 7" },
  { id: "ansiBrightBlack", label: "bright black", group: "ansi", hint: "ANSI 8" },
  { id: "ansiBrightRed", label: "bright red", group: "ansi", hint: "ANSI 9" },
  { id: "ansiBrightGreen", label: "bright green", group: "ansi", hint: "ANSI 10" },
  { id: "ansiBrightYellow", label: "bright yellow", group: "ansi", hint: "ANSI 11" },
  { id: "ansiBrightBlue", label: "bright blue", group: "ansi", hint: "ANSI 12" },
  { id: "ansiBrightMagenta", label: "bright magenta", group: "ansi", hint: "ANSI 13" },
  { id: "ansiBrightCyan", label: "bright cyan", group: "ansi", hint: "ANSI 14" },
  { id: "ansiBrightWhite", label: "bright white", group: "ansi", hint: "ANSI 15" },
] as const satisfies readonly Role[];

export type RoleId = (typeof ROLES)[number]["id"];
export type ColorMap = Record<RoleId, string>;

export const ROLE_IDS = ROLES.map((r) => r.id) as RoleId[];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<
  RoleId,
  Role
>;

export const GROUP_LABELS: Record<RoleGroup, string> = {
  ui: "Editor",
  syntax: "Syntax",
  diagnostic: "Diagnostics",
  ansi: "Terminal",
};

export const GROUP_ORDER: RoleGroup[] = ["ui", "syntax", "diagnostic", "ansi"];

export function rolesInGroup(group: RoleGroup): Role[] {
  return ROLES.filter((r) => r.group === group);
}

/** The 16 ANSI slots in wire order — exporters that emit palettes need this. */
export const ANSI_ORDER: RoleId[] = [
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
