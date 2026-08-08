import { nearestXterm256 } from "@/lib/color";
import { ANSI_ORDER } from "@/lib/theme/roles";
import { slugify } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import { CORE_GROUPS, type HlSpec } from "./groups";
import type { ExportTarget } from "./types";

/**
 * Vim gets the classic group names plus `cterm*` fallbacks, so the scheme
 * still looks right over SSH on a terminal without truecolor.
 */
function hiLine(name: string, spec: HlSpec, t: Theme): string {
  const parts: string[] = [];
  const style = spec.style?.length ? spec.style.join(",") : "NONE";

  if (spec.fg) {
    parts.push(`guifg=${t.colors[spec.fg]}`);
    parts.push(`ctermfg=${nearestXterm256(t.colors[spec.fg])}`);
  } else {
    parts.push("guifg=NONE", "ctermfg=NONE");
  }
  if (spec.bg) {
    parts.push(`guibg=${t.colors[spec.bg]}`);
    parts.push(`ctermbg=${nearestXterm256(t.colors[spec.bg])}`);
  } else {
    parts.push("guibg=NONE", "ctermbg=NONE");
  }
  if (spec.sp) parts.push(`guisp=${t.colors[spec.sp]}`);

  // `undercurl` and `strikethrough` have no cterm equivalent everywhere.
  const ctermStyle =
    spec.style
      ?.map((s) => (s === "undercurl" ? "underline" : s))
      .filter((s) => s !== "strikethrough")
      .join(",") || "NONE";

  parts.push(`gui=${style}`, `cterm=${ctermStyle}`);
  return `hi ${name} ${parts.join(" ")}`;
}

function vimscript(t: Theme): string {
  const slug = slugify(t.name);
  const body = CORE_GROUPS.map(([name, spec]) => hiLine(name, spec, t)).join("\n");
  const ansi = ANSI_ORDER.map((id) => `'${t.colors[id]}'`).join(", ");

  return `" ${t.name}
" Vim colorscheme generated with themephile.dev
" Save as ~/.vim/colors/${slug}.vim, then :colorscheme ${slug}

set background=${t.appearance}

hi clear
if exists("syntax_on")
  syntax reset
endif

let g:colors_name = "${slug}"

if has("termguicolors") && !has("gui_running")
  set termguicolors
endif

${body}

" :terminal palette
let g:terminal_ansi_colors = [${ansi}]
`;
}

export const vimTarget: ExportTarget = {
  id: "vim",
  label: "Vim",
  family: "editor",
  blurb:
    "Classic vimscript colorscheme with 256-color `cterm` fallbacks, so it holds up over SSH.",
  files: (t) => [
    { filename: `${slugify(t.name)}.vim`, language: "vim", contents: vimscript(t) },
  ],
  install: (t) => {
    const slug = slugify(t.name);
    return [
      `Save the file as \`~/.vim/colors/${slug}.vim\` (create the folder with \`mkdir -p ~/.vim/colors\`).`,
      `Run \`:colorscheme ${slug}\`.`,
      `To keep it, add \`colorscheme ${slug}\` to your \`~/.vimrc\`.`,
      "Truecolor is enabled automatically where available; otherwise the `ctermfg` fallbacks kick in.",
    ];
  },
};
