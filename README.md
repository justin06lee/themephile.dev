# themephile.dev

A visual theme editor for code, with no account and no server. Tune every
syntax color against real code, then copy a finished config for your editor,
your terminal, or tmux.

Two tools:

- **`/editor`** — 48 editable roles (editor chrome, syntax, diagnostics, ANSI 16)
  previewed across six languages, plus a mock editor UI and a terminal session.
  Exports to VS Code, Neovim, Vim, Emacs, Alacritty, kitty, Ghostty, WezTerm,
  Windows Terminal, and raw JSON.
- **`/tmux`** — a visual status-bar builder (segments, powerline separators,
  pane borders, prefix key, vi bindings) with a live terminal preview. Exports a
  complete `.tmux.conf`.

Everything runs in the browser. A theme is persisted to `localStorage` and
encoded into the URL fragment, so sharing a link shares the whole palette —
nothing is ever uploaded.

## Development

```bash
bun install
bun dev        # http://localhost:3000
bun run build  # production build
bun run lint
```

Next.js 16 (App Router), React 19, Tailwind CSS v4. No runtime dependencies
beyond those — the syntax highlighter, color math, and every exporter are local.

## Layout

```
app/
  page.tsx            landing
  editor/page.tsx     theme editor      → components/editor/EditorApp
  tmux/page.tsx       tmux studio       → components/tmux/TmuxApp
lib/
  color.ts            OKLab/OKLCh conversion, WCAG contrast, xterm-256 matching
  theme/
    roles.ts          the 48 role ids — the vocabulary every exporter maps from
    theme.ts          seed → full theme generator, contrast repair
    presets.ts        starting seeds
    serialize.ts      URL-fragment encoding, localStorage, downloads
  highlight/
    tokenize.ts       hand-rolled tokenizer (tsx, python, rust, go, lua, css)
    samples.ts        preview code
  export/             one module per target + the shared Vim/Neovim group table
  tmux/               config model and .tmux.conf generator
components/
  preview/            code surface, editor chrome, terminal mock
  editor/             role list, inspector, color picker, export dialog
  tmux/               status bar, terminal preview, controls
```

Both workspaces read browser state during their first render, so they are
loaded with `ssr: false` behind a skeleton — the static shell prerenders, and
there's no flash of the default theme before your saved one appears.

### Why a custom tokenizer

Off-the-shelf highlighters emit TextMate scopes, and collapsing ~2000 scopes
onto 16 editable roles is guesswork in the wrong direction. Here each token is
*born* as a role, so clicking a token in the preview and clicking its swatch in
the sidebar are the same action. It's approximate — there's no parser — but it
only has to be convincing enough to judge a color by.

### Adding an export target

Implement `ExportTarget` (`lib/export/types.ts`) — an id, a label, a `files()`
that returns one or more `{ filename, language, contents }`, and `install()`
steps — then add it to `TARGETS` in `lib/export/index.ts`. The export dialog,
the landing page list, and the download buttons pick it up automatically.

Vim and Neovim share their highlight-group table (`lib/export/groups.ts`) so the
two colorschemes can't drift apart.

## Verification

The generated configs are checked against the real programs, not just eyeballed:
the Emacs theme loads under `emacs --batch`, the Vim colorscheme sources under
`vim -es -u NONE`, and every `.tmux.conf` variant boots a real `tmux` server
with no errors.
