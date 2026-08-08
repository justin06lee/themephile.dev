import { ANSI_ORDER, ROLE_IDS } from "@/lib/theme/roles";
import { slugify } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import { CORE_GROUPS, NVIM_EXTRA_GROUPS, TREESITTER_GROUPS, type GroupTable, type HlSpec } from "./groups";
import type { ExportTarget } from "./types";

/** Groups that should fall away when the user wants a see-through editor. */
const TRANSPARENT_AWARE = new Set([
  "Normal",
  "NormalNC",
  "SignColumn",
  "FoldColumn",
  "EndOfBuffer",
  "MsgArea",
]);

function luaOpts(name: string, spec: HlSpec): string {
  const parts: string[] = [];
  if (spec.fg) parts.push(`fg = c.${spec.fg}`);
  if (spec.bg) {
    parts.push(
      spec.bg === "bg" && TRANSPARENT_AWARE.has(name)
        ? `bg = transparent and "NONE" or c.bg`
        : `bg = c.${spec.bg}`,
    );
  }
  if (spec.sp) parts.push(`sp = c.${spec.sp}`);
  for (const s of spec.style ?? []) parts.push(`${s} = true`);
  return `{ ${parts.join(", ")} }`;
}

function renderTable(table: GroupTable): string {
  return table.map(([name, spec]) => `  hl("${name}", ${luaOpts(name, spec)})`).join("\n");
}

function lua(t: Theme): string {
  const slug = slugify(t.name);
  const palette = ROLE_IDS.map((id) => `  ${id} = "${t.colors[id]}",`).join("\n");
  const terminal = ANSI_ORDER.map(
    (id, i) => `  vim.g["terminal_color_${i}"] = c.${id}`,
  ).join("\n");

  return `-- ${t.name}
-- Neovim colorscheme generated with themephile.dev
-- Drop this in ~/.config/nvim/colors/${slug}.lua and run :colorscheme ${slug}

local transparent = false -- set true to keep your terminal's background

local c = {
${palette}
}

local function hl(group, opts)
  vim.api.nvim_set_hl(0, group, opts)
end

vim.cmd("highlight clear")
if vim.fn.exists("syntax_on") == 1 then
  vim.cmd("syntax reset")
end

vim.o.background = "${t.appearance}"
vim.o.termguicolors = true
vim.g.colors_name = "${slug}"

-- Interface and classic syntax groups
${renderTable(CORE_GROUPS)}

-- Treesitter captures and LSP semantic tokens
${renderTable(TREESITTER_GROUPS)}

-- Diagnostics and common plugins
${renderTable(NVIM_EXTRA_GROUPS)}

-- :terminal palette
${terminal}

return c
`;
}

export const neovimTarget: ExportTarget = {
  id: "neovim",
  label: "Neovim",
  family: "editor",
  blurb:
    "Lua colorscheme covering treesitter captures, LSP semantic tokens, diagnostics, and the plugins you already have.",
  files: (t) => [
    { filename: `${slugify(t.name)}.lua`, language: "lua", contents: lua(t) },
  ],
  install: (t) => {
    const slug = slugify(t.name);
    return [
      `Save the file as \`~/.config/nvim/colors/${slug}.lua\` (create the \`colors\` folder if it isn't there).`,
      `Run \`:colorscheme ${slug}\` to try it for the session.`,
      `To make it stick, add \`vim.cmd.colorscheme("${slug}")\` to your \`init.lua\`.`,
      "Set `local transparent = true` at the top of the file to keep your terminal background showing through.",
      "Needs `termguicolors` — already switched on by the file itself.",
    ];
  },
};
