import { TARGETS } from "@/lib/export";
import { PARSERS } from "@/lib/import";
import { LANGUAGES } from "@/lib/highlight/tokenize";
import { PRESET_SEEDS } from "@/lib/theme/presets";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  ROLE_IDS,
  rolesInGroup,
} from "@/lib/theme/roles";
import { REPO_URL, SITE_URL } from "@/lib/site";

/**
 * A route handler rather than a file in public/, because it is derived.
 *
 * The README states the design contract: adding an export target means adding
 * it to TARGETS, after which "the export dialog, the landing page list, and the
 * download buttons pick it up automatically." A hand-written public/llms.txt
 * would be the one artifact that didn't — it would describe ten targets
 * forever. Reading TARGETS, ROLE_IDS, LANGUAGES and PRESET_SEEDS means the file
 * cannot lie about the product.
 *
 * Worth being honest about the weight: Google Search ignores llms.txt, and no
 * major AI search provider has confirmed consuming third-party ones. The
 * evidenced consumer is AI coding agents — which is exactly this audience.
 */
export const dynamic = "force-static";

export function GET() {
  const body = `# themephile

> themephile is a free, open-source (MIT) theme editor for code. Design a syntax
> colorscheme against live previews of VS Code, Neovim, Vim, Emacs, and a terminal,
> then copy a ready-to-paste config for your editor, your terminal, or tmux. Existing
> themes can be imported by pasting the file or dropping it in. The editor runs entirely
> in the browser with no account and nothing uploaded; a separate gallery hosts themes
> people have published, which is free to browse anonymously.

## Tools

- [Theme editor](${SITE_URL}/editor): Edit ${ROLE_IDS.length} color roles against live previews of five programs, with ${LANGUAGES.length} sample languages (${LANGUAGES.map((l) => l.label).join(", ")}) and ${PRESET_SEEDS.length} starting presets. Requires JavaScript.
- [tmux studio](${SITE_URL}/tmux): Build a tmux status bar visually — segments, powerline separators, pane borders, prefix key — and export a complete .tmux.conf. Requires JavaScript.
- [Theme gallery](${SITE_URL}/themes): Colorschemes published by other people, sorted by likes or date and filterable by dark/light. Browsing, opening and exporting need no account; publishing and liking sign in with GitHub. Each theme has its own page listing every role and hex code.

## Import formats

A theme can be pasted in or dropped in as a file; it is parsed in the browser and
mapped onto the ${ROLE_IDS.length} roles. Roles a format cannot express are derived from the ones
it can, following the base16 convention, and the dialog reports exactly which.

${PARSERS.filter((p) => p.id !== "hex-list")
  .map((p) => `- ${p.label}: ${p.blurb}`)
  .join("\n")}
- Anything else: any text containing hex colors, sorted by lightness and hue into the nearest roles.

## Export targets

${TARGETS.map((t) => `- ${t.label}: ${t.blurb}`).join("\n")}
- tmux: A complete .tmux.conf covering status bar, panes, messages, and key bindings (from tmux studio).

## Role vocabulary

Every exporter translates from one neutral set of ${ROLE_IDS.length} roles.

${GROUP_ORDER.map(
  (g) =>
    `- ${GROUP_LABELS[g]} (${rolesInGroup(g).length}): ${rolesInGroup(g)
      .map((r) => r.id)
      .join(", ")}`,
).join("\n")}

## Facts

- Price: free. No paid tier, ever.
- Accounts: none needed to use the editor, the tmux studio, or to browse, open and export any published theme. Signing in with GitHub is required only to publish a theme to the gallery or to like one.
- License: MIT. Source: ${REPO_URL}
- Privacy: the editor and tmux studio contact no server at all. A theme is stored in localStorage and encoded into the URL fragment, which browsers never send to a server. Imported files are read in the tab and never uploaded. No analytics, no telemetry, no cookies. The gallery stores published themes and, for signed-in users, only the GitHub handle and avatar URL.
- Palettes are generated in OKLCh from a seed: background, foreground, base hue, harmony scheme, chroma multiplier.
- Contrast: every role shows its live WCAG ratio against the canvas. "Fix contrast" finds roles below the AA-large 3:1 floor and lifts them past 4:1 by changing lightness only, preserving hue and chroma.
- Generated configs are checked against the real programs: the Emacs theme loads under \`emacs --batch\`, the Vim colorscheme sources under \`vim -es -u NONE\`, and each .tmux.conf boots a real tmux server.
- Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and @libsql/client for the gallery alone (SQLite on Turso). The highlighter, colour maths, exporters and importers have no dependencies.
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
