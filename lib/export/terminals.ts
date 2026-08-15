import { ANSI_ORDER, ROLE_IDS } from "@/lib/theme/roles";
import { slugify } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import type { ExportTarget } from "./types";

const NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
] as const;

const normal = (t: Theme) => ANSI_ORDER.slice(0, 8).map((id) => t.colors[id]);
const bright = (t: Theme) => ANSI_ORDER.slice(8).map((id) => t.colors[id]);

/* ------------------------------- alacritty -------------------------------- */

function alacritty(t: Theme): string {
  const c = t.colors;
  const block = (label: string, colors: string[]) =>
    `[colors.${label}]\n` +
    NAMES.map((n, i) => `${n.padEnd(7)} = "${colors[i]}"`).join("\n");

  return `# ${t.name}
# Alacritty colors, generated with themephile.dev

[colors.primary]
background = "${c.bg}"
foreground = "${c.fg}"
dim_foreground = "${c.fgDim}"
bright_foreground = "${c.ansiBrightWhite}"

[colors.cursor]
text = "${c.bg}"
cursor = "${c.cursor}"

[colors.vi_mode_cursor]
text = "${c.bg}"
cursor = "${c.accent}"

[colors.selection]
text = "CellForeground"
background = "${c.selection}"

[colors.search.matches]
foreground = "${c.fg}"
background = "${c.matchBg}"

[colors.footer_bar]
foreground = "${c.fg}"
background = "${c.bgAlt}"

${block("normal", normal(t))}

${block("bright", bright(t))}
`;
}

export const alacrittyTarget: ExportTarget = {
  id: "alacritty",
  label: "Alacritty",
  family: "terminal",
  blurb: "TOML color block for Alacritty 0.13 and newer.",
  files: (t) => [
    {
      filename: `${slugify(t.name)}.toml`,
      language: "toml",
      contents: alacritty(t),
    },
  ],
  install: (t) => [
    `Save it as \`~/.config/alacritty/themes/${slugify(t.name)}.toml\`.`,
    'Add `general.import = ["~/.config/alacritty/themes/' +
      slugify(t.name) +
      '.toml"]` to your `alacritty.toml`.',
    "Alacritty reloads config on save — no restart.",
  ],
};

/* --------------------------------- kitty ---------------------------------- */

function kitty(t: Theme): string {
  const c = t.colors;
  const palette = [...normal(t), ...bright(t)]
    .map((hex, i) => `color${i.toString().padEnd(2)} ${hex}`)
    .join("\n");

  return `# ${t.name}
# kitty theme, generated with themephile.dev

background            ${c.bg}
foreground            ${c.fg}
selection_background  ${c.selection}
selection_foreground  ${c.fg}

cursor                ${c.cursor}
cursor_text_color     ${c.bg}

url_color             ${c.info}

active_border_color   ${c.accent}
inactive_border_color ${c.border}
bell_border_color     ${c.warning}

active_tab_background   ${c.bg}
active_tab_foreground   ${c.fg}
inactive_tab_background ${c.bgAlt}
inactive_tab_foreground ${c.fgDim}
tab_bar_background      ${c.bgAlt}

mark1_foreground ${c.bg}
mark1_background ${c.accent}

${palette}
`;
}

export const kittyTarget: ExportTarget = {
  id: "kitty",
  label: "kitty",
  family: "terminal",
  blurb: "Full kitty theme including tab bar, marks, and border colors.",
  files: (t) => [
    { filename: `${slugify(t.name)}.conf`, language: "conf", contents: kitty(t) },
  ],
  install: (t) => [
    `Save as \`~/.config/kitty/themes/${slugify(t.name)}.conf\`.`,
    `Add \`include ./themes/${slugify(t.name)}.conf\` to \`~/.config/kitty/kitty.conf\`.`,
    "Reload with `ctrl+shift+f5`, or restart kitty.",
  ],
};

/* -------------------------------- ghostty --------------------------------- */

function ghostty(t: Theme): string {
  const c = t.colors;
  const palette = [...normal(t), ...bright(t)]
    .map((hex, i) => `palette = ${i}=${hex}`)
    .join("\n");

  return `# ${t.name}
# Ghostty theme, generated with themephile.dev

background = ${c.bg}
foreground = ${c.fg}

cursor-color = ${c.cursor}
cursor-text = ${c.bg}

selection-background = ${c.selection}
selection-foreground = ${c.fg}

${palette}
`;
}

export const ghosttyTarget: ExportTarget = {
  id: "ghostty",
  label: "Ghostty",
  family: "terminal",
  blurb: "Drop-in Ghostty theme file.",
  files: (t) => [
    { filename: slugify(t.name), language: "conf", contents: ghostty(t) },
  ],
  install: (t) => [
    `Save it (no extension) as \`~/.config/ghostty/themes/${slugify(t.name)}\`.`,
    `Add \`theme = ${slugify(t.name)}\` to \`~/.config/ghostty/config\`.`,
    "Reload with `cmd+shift+,` on macOS, or restart Ghostty.",
  ],
};

/* -------------------------------- wezterm --------------------------------- */

function wezterm(t: Theme): string {
  const c = t.colors;
  const list = (xs: string[]) => xs.map((h) => `"${h}"`).join(", ");
  return `-- ${t.name}
-- WezTerm color scheme, generated with themephile.dev

return {
  foreground = "${c.fg}",
  background = "${c.bg}",

  cursor_bg = "${c.cursor}",
  cursor_fg = "${c.bg}",
  cursor_border = "${c.cursor}",

  selection_fg = "${c.fg}",
  selection_bg = "${c.selection}",

  scrollbar_thumb = "${c.border}",
  split = "${c.border}",

  ansi = { ${list(normal(t))} },
  brights = { ${list(bright(t))} },

  tab_bar = {
    background = "${c.bgAlt}",
    active_tab = { bg_color = "${c.bg}", fg_color = "${c.fg}" },
    inactive_tab = { bg_color = "${c.bgAlt}", fg_color = "${c.fgDim}" },
    new_tab = { bg_color = "${c.bgAlt}", fg_color = "${c.fgDim}" },
  },
}
`;
}

export const weztermTarget: ExportTarget = {
  id: "wezterm",
  label: "WezTerm",
  family: "terminal",
  blurb: "Lua color scheme, including the tab bar.",
  files: (t) => [
    { filename: `${slugify(t.name)}.lua`, language: "lua", contents: wezterm(t) },
  ],
  install: (t) => [
    `Save as \`~/.config/wezterm/colors/${slugify(t.name)}.lua\`.`,
    `Set \`config.color_scheme = "${slugify(t.name)}"\` in \`wezterm.lua\`.`,
    "WezTerm picks up changes on save.",
  ],
};

/* ---------------------------- windows terminal ---------------------------- */

/**
 * Windows Terminal's scheme keys are lowercase, and ANSI 5 is spelled
 * `purple` — not `magenta`, the way every other terminal spells it. Keys that
 * don't match are dropped silently, with no error and no warning, so this
 * table is deliberately separate from `NAMES`.
 */
const WT_NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "purple",
  "cyan",
  "white",
] as const;

function windowsTerminal(t: Theme): string {
  const c = t.colors;
  const named = Object.fromEntries(
    [...normal(t), ...bright(t)].map((hex, i) => {
      const base = WT_NAMES[i % 8];
      const label =
        i < 8 ? base : `bright${base.charAt(0).toUpperCase() + base.slice(1)}`;
      return [label, hex];
    }),
  );

  return `${JSON.stringify(
    {
      name: t.name,
      background: c.bg,
      foreground: c.fg,
      cursorColor: c.cursor,
      selectionBackground: c.selection,
      ...named,
    },
    null,
    2,
  )}\n`;
}

export const windowsTerminalTarget: ExportTarget = {
  id: "windows-terminal",
  label: "Windows Terminal",
  family: "terminal",
  blurb: "A scheme object for the Windows Terminal settings file.",
  files: (t) => [
    {
      filename: "scheme.json",
      language: "json",
      contents: windowsTerminal(t),
    },
  ],
  install: (t) => [
    "Open Windows Terminal settings and choose **Open JSON file**.",
    "Paste this object into the `schemes` array.",
    `In your profile, set \`"colorScheme": "${t.name}"\`.`,
  ],
};

/* ---------------------------------- raw ----------------------------------- */

function rawJson(t: Theme): string {
  return `${JSON.stringify(
    {
      name: t.name,
      appearance: t.appearance,
      generator: "themephile.dev",
      colors: Object.fromEntries(ROLE_IDS.map((id) => [id, t.colors[id]])),
    },
    null,
    2,
  )}\n`;
}

export const rawTarget: ExportTarget = {
  id: "raw",
  label: "JSON",
  family: "raw",
  blurb:
    "Every role as flat JSON — for writing your own exporter, or feeding a design system.",
  files: (t) => [
    { filename: `${slugify(t.name)}.json`, language: "json", contents: rawJson(t) },
  ],
  install: () => [
    "Keys are stable role ids — safe to depend on.",
    "Same shape the editor uses internally, so it round-trips.",
  ],
};
