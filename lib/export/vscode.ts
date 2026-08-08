import { slugify } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import { alpha, type ExportTarget } from "./types";

/**
 * TextMate scope mapping. This is the part everyone gets wrong — a theme that
 * only sets `comment` and `string` looks unfinished the moment you open a real
 * file, so each role claims the full family of scopes editors actually emit.
 */
const SCOPES: Record<string, string[]> = {
  comment: ["comment", "punctuation.definition.comment", "comment.block.documentation"],
  keyword: [
    "keyword",
    "keyword.control",
    "keyword.other",
    "keyword.operator.expression",
    "keyword.operator.new",
    "keyword.control.flow",
  ],
  storage: [
    "storage",
    "storage.type",
    "storage.modifier",
    "keyword.declaration",
    "variable.language.this",
    "variable.language.self",
  ],
  string: [
    "string",
    "string.quoted",
    "string.template",
    "punctuation.definition.string",
    "meta.attribute string",
  ],
  escape: [
    "constant.character.escape",
    "string.regexp",
    "constant.regexp",
    "punctuation.definition.template-expression",
    "meta.template.expression punctuation.definition.template-expression",
  ],
  number: ["constant.numeric", "constant.other.numeric"],
  constant: [
    "constant.language",
    "constant.language.boolean",
    "constant.language.null",
    "variable.other.constant",
    "support.constant",
  ],
  function: [
    "entity.name.function",
    "support.function",
    "meta.function-call.generic",
    "variable.function",
    "entity.name.method",
  ],
  type: [
    "entity.name.type",
    "entity.name.class",
    "entity.name.namespace",
    "entity.other.inherited-class",
    "support.type",
    "support.class",
    "meta.type.annotation",
  ],
  variable: [
    "variable",
    "variable.other.readwrite",
    "meta.definition.variable entity.name.function",
    "source",
  ],
  parameter: ["variable.parameter", "meta.parameter", "meta.function.parameters"],
  property: [
    "variable.other.property",
    "variable.other.object.property",
    "support.variable.property",
    "meta.object-literal.key",
    "support.type.property-name",
  ],
  operator: ["keyword.operator", "punctuation.accessor"],
  punctuation: [
    "punctuation",
    "meta.brace",
    "punctuation.separator",
    "punctuation.terminator",
    "punctuation.definition.parameters",
  ],
  tag: ["entity.name.tag", "support.class.component", "punctuation.definition.tag"],
  attribute: [
    "entity.other.attribute-name",
    "meta.decorator",
    "entity.name.function.decorator",
    "meta.tag.attributes entity.other.attribute-name",
  ],
};

function workbench(t: Theme) {
  const c = t.colors;
  return {
    focusBorder: c.accent,
    foreground: c.fg,
    descriptionForeground: c.fgDim,
    errorForeground: c.error,
    "widget.border": c.border,

    "editor.background": c.bg,
    "editor.foreground": c.fg,
    "editorLineNumber.foreground": c.lineNumber,
    "editorLineNumber.activeForeground": c.lineNumberActive,
    "editorCursor.foreground": c.cursor,
    "editor.selectionBackground": c.selection,
    "editor.selectionHighlightBackground": alpha(c.selection, 0.6),
    "editor.inactiveSelectionBackground": alpha(c.selection, 0.5),
    "editor.wordHighlightBackground": alpha(c.accent, 0.18),
    "editor.lineHighlightBackground": c.currentLine,
    "editor.findMatchBackground": c.matchBg,
    "editor.findMatchHighlightBackground": alpha(c.matchBg, 0.55),
    "editorBracketMatch.background": alpha(c.accent, 0.18),
    "editorBracketMatch.border": c.accent,
    "editorIndentGuide.background1": alpha(c.border, 0.6),
    "editorIndentGuide.activeBackground1": c.border,
    "editorWhitespace.foreground": alpha(c.fgDim, 0.4),
    "editorRuler.foreground": alpha(c.border, 0.8),
    "editorGutter.addedBackground": c.success,
    "editorGutter.modifiedBackground": c.warning,
    "editorGutter.deletedBackground": c.error,
    "editorError.foreground": c.error,
    "editorWarning.foreground": c.warning,
    "editorInfo.foreground": c.info,
    "editorHint.foreground": c.info,

    "editorWidget.background": c.bgAlt,
    "editorWidget.border": c.border,
    "editorSuggestWidget.background": c.bgAlt,
    "editorSuggestWidget.selectedBackground": alpha(c.accent, 0.2),
    "editorHoverWidget.background": c.bgAlt,
    "editorHoverWidget.border": c.border,
    "peekViewEditor.background": c.bgAlt,
    "peekViewResult.background": c.bgAlt,

    "sideBar.background": c.bgAlt,
    "sideBar.foreground": c.fgDim,
    "sideBar.border": c.border,
    "sideBarTitle.foreground": c.fg,
    "sideBarSectionHeader.background": c.bgAlt,
    "sideBarSectionHeader.border": c.border,

    "activityBar.background": c.bgAlt,
    "activityBar.foreground": c.fg,
    "activityBar.inactiveForeground": c.fgDim,
    "activityBar.border": c.border,
    "activityBarBadge.background": c.accent,
    "activityBarBadge.foreground": c.bg,

    "editorGroupHeader.tabsBackground": c.bgAlt,
    "editorGroup.border": c.border,
    "tab.activeBackground": c.bg,
    "tab.activeForeground": c.fg,
    "tab.inactiveBackground": c.bgAlt,
    "tab.inactiveForeground": c.fgDim,
    "tab.border": c.border,
    "tab.activeBorderTop": c.accent,
    "tab.hoverBackground": c.currentLine,

    "statusBar.background": c.bgAlt,
    "statusBar.foreground": c.fgDim,
    "statusBar.border": c.border,
    "statusBar.noFolderBackground": c.bgAlt,
    "statusBar.debuggingBackground": c.warning,
    "statusBarItem.remoteBackground": c.accent,
    "statusBarItem.remoteForeground": c.bg,

    "titleBar.activeBackground": c.bgAlt,
    "titleBar.activeForeground": c.fg,
    "titleBar.inactiveBackground": c.bgAlt,
    "titleBar.inactiveForeground": c.fgDim,
    "titleBar.border": c.border,

    "panel.background": c.bgAlt,
    "panel.border": c.border,
    "panelTitle.activeForeground": c.fg,
    "panelTitle.activeBorder": c.accent,
    "panelTitle.inactiveForeground": c.fgDim,

    "list.activeSelectionBackground": alpha(c.accent, 0.22),
    "list.activeSelectionForeground": c.fg,
    "list.inactiveSelectionBackground": c.currentLine,
    "list.hoverBackground": c.currentLine,
    "list.highlightForeground": c.accent,
    "list.errorForeground": c.error,
    "list.warningForeground": c.warning,

    "input.background": c.bg,
    "input.foreground": c.fg,
    "input.border": c.border,
    "input.placeholderForeground": c.fgDim,
    "inputOption.activeBorder": c.accent,
    "dropdown.background": c.bgAlt,
    "dropdown.border": c.border,
    "dropdown.foreground": c.fg,

    "button.background": c.accent,
    "button.foreground": c.bg,
    "button.hoverBackground": alpha(c.accent, 0.85),
    "badge.background": c.accent,
    "badge.foreground": c.bg,
    "progressBar.background": c.accent,

    "scrollbarSlider.background": alpha(c.fgDim, 0.25),
    "scrollbarSlider.hoverBackground": alpha(c.fgDim, 0.4),
    "scrollbarSlider.activeBackground": alpha(c.accent, 0.5),

    "gitDecoration.addedResourceForeground": c.success,
    "gitDecoration.modifiedResourceForeground": c.warning,
    "gitDecoration.deletedResourceForeground": c.error,
    "gitDecoration.untrackedResourceForeground": c.info,
    "gitDecoration.ignoredResourceForeground": c.fgDim,
    "diffEditor.insertedTextBackground": alpha(c.success, 0.14),
    "diffEditor.removedTextBackground": alpha(c.error, 0.14),

    "minimap.findMatchHighlight": c.matchBg,
    "breadcrumb.foreground": c.fgDim,
    "breadcrumb.focusForeground": c.fg,
    "menu.background": c.bgAlt,
    "menu.foreground": c.fg,
    "menu.selectionBackground": alpha(c.accent, 0.22),

    "terminal.background": c.bg,
    "terminal.foreground": c.fg,
    "terminalCursor.foreground": c.cursor,
    "terminal.selectionBackground": c.selection,
    "terminal.ansiBlack": c.ansiBlack,
    "terminal.ansiRed": c.ansiRed,
    "terminal.ansiGreen": c.ansiGreen,
    "terminal.ansiYellow": c.ansiYellow,
    "terminal.ansiBlue": c.ansiBlue,
    "terminal.ansiMagenta": c.ansiMagenta,
    "terminal.ansiCyan": c.ansiCyan,
    "terminal.ansiWhite": c.ansiWhite,
    "terminal.ansiBrightBlack": c.ansiBrightBlack,
    "terminal.ansiBrightRed": c.ansiBrightRed,
    "terminal.ansiBrightGreen": c.ansiBrightGreen,
    "terminal.ansiBrightYellow": c.ansiBrightYellow,
    "terminal.ansiBrightBlue": c.ansiBrightBlue,
    "terminal.ansiBrightMagenta": c.ansiBrightMagenta,
    "terminal.ansiBrightCyan": c.ansiBrightCyan,
    "terminal.ansiBrightWhite": c.ansiBrightWhite,
  };
}

function themeJson(t: Theme): string {
  const c = t.colors;
  const tokenColors = Object.entries(SCOPES).map(([role, scope]) => ({
    name: role,
    scope,
    settings: {
      foreground: c[role as keyof typeof c],
      ...(role === "comment" ? { fontStyle: "italic" } : {}),
    },
  }));

  return `${JSON.stringify(
    {
      $schema: "vscode://schemas/color-theme",
      name: t.name,
      type: t.appearance,
      semanticHighlighting: true,
      colors: workbench(t),
      tokenColors,
      semanticTokenColors: {
        variable: c.variable,
        "variable.readonly": c.constant,
        parameter: c.parameter,
        property: c.property,
        "property.readonly": c.property,
        function: c.function,
        method: c.function,
        class: c.type,
        interface: c.type,
        enum: c.type,
        enumMember: c.constant,
        type: c.type,
        typeParameter: c.type,
        namespace: c.type,
        keyword: c.keyword,
        modifier: c.storage,
        comment: c.comment,
        string: c.string,
        number: c.number,
        operator: c.operator,
        decorator: c.attribute,
      },
    },
    null,
    2,
  )}\n`;
}

function packageJson(t: Theme): string {
  const slug = slugify(t.name);
  return `${JSON.stringify(
    {
      name: `${slug}-theme`,
      displayName: t.name,
      description: `${t.name} — generated with themephile.dev`,
      version: "1.0.0",
      publisher: "local",
      engines: { vscode: "^1.70.0" },
      categories: ["Themes"],
      contributes: {
        themes: [
          {
            label: t.name,
            uiTheme: t.appearance === "dark" ? "vs-dark" : "vs",
            path: `./themes/${slug}-color-theme.json`,
          },
        ],
      },
    },
    null,
    2,
  )}\n`;
}

export const vscodeTarget: ExportTarget = {
  id: "vscode",
  label: "VS Code",
  family: "editor",
  blurb:
    "A full color theme: workbench chrome, TextMate scopes, and semantic tokens. Works in Cursor and Windsurf too.",
  files: (t) => [
    {
      filename: `${slugify(t.name)}-color-theme.json`,
      language: "json",
      contents: themeJson(t),
    },
    { filename: "package.json", language: "json", contents: packageJson(t) },
  ],
  install: (t) => {
    const slug = slugify(t.name);
    return [
      `Create the folder \`~/.vscode/extensions/${slug}-theme/themes/\` (on Windows: \`%USERPROFILE%\\.vscode\\extensions\\${slug}-theme\\themes\\\`).`,
      `Save \`${slug}-color-theme.json\` into that \`themes/\` folder.`,
      `Save \`package.json\` one level up, in \`${slug}-theme/\`.`,
      "Restart VS Code, then run **Preferences: Color Theme** from the command palette and pick " +
        `**${t.name}**.`,
      "Editing the JSON while VS Code runs applies instantly — no reload needed.",
    ];
  },
};
