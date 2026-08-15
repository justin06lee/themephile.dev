import { ANSI_ORDER, ROLE_IDS, type RoleId } from "@/lib/theme/roles";
import type { Appearance } from "@/lib/theme/theme";
import {
  EMACS_FACES,
  VIM_SOURCES,
  VSCODE_SCOPES,
  VSCODE_SEMANTIC,
  VSCODE_WORKBENCH,
  type Channel,
  type GroupSource,
} from "./maps";
import { isRecord, looseJson, parseColor } from "./scan";
import type { PartialColors, ParseResult, Parser } from "./types";

/** What a parsed highlight group / face carries, per channel. */
type Spec = Partial<Record<Channel, string>>;

function fromSources(
  groups: Map<string, Spec>,
  sources: Partial<Record<RoleId, GroupSource[]>>,
): PartialColors {
  const out: PartialColors = {};
  for (const role of ROLE_IDS) {
    for (const { group, channel } of sources[role] ?? []) {
      const hit = parseColor(groups.get(group.toLowerCase())?.[channel]);
      if (hit) {
        out[role] = hit;
        break;
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                  VS Code                                   */
/*                    (also Cursor, Windsurf, and VSCodium)                   */
/* -------------------------------------------------------------------------- */

/**
 * TextMate scopes nest on dots, so `comment` and `comment.line.double-slash`
 * are the same idea at different resolutions. We try exact, then a rule more
 * specific than what we asked for, then the closest ancestor.
 */
function matchScope(scopes: Map<string, string>, want: string): string | undefined {
  const exact = scopes.get(want);
  if (exact) return exact;

  for (const [scope, color] of scopes) {
    if (scope.startsWith(`${want}.`)) return color;
  }

  let best: string | undefined;
  let bestLen = -1;
  for (const [scope, color] of scopes) {
    if (want.startsWith(`${scope}.`) && scope.length > bestLen) {
      best = color;
      bestLen = scope.length;
    }
  }
  return best;
}

function parseVsCode(text: string): ParseResult | null {
  const root = looseJson(text);
  if (!isRecord(root)) return null;

  const workbench = isRecord(root.colors) ? root.colors : {};
  const colors: PartialColors = {};

  for (const role of ROLE_IDS) {
    for (const key of VSCODE_WORKBENCH[role] ?? []) {
      const hit = parseColor(workbench[key] as string);
      if (hit) {
        colors[role] = hit;
        break;
      }
    }
  }

  // ── tokenColors ──
  // Later rules win in TextMate, so a theme that broadly paints `keyword` and
  // then re-paints `keyword.operator` gets read the way the editor reads it.
  const scopes = new Map<string, string>();
  if (Array.isArray(root.tokenColors)) {
    for (const rule of root.tokenColors) {
      if (!isRecord(rule)) continue;
      const settings = isRecord(rule.settings) ? rule.settings : null;
      const fg = settings?.foreground;
      if (typeof fg !== "string") continue;

      const raw = rule.scope;
      const list = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? raw.split(",")
          : [];
      for (const scope of list) {
        if (typeof scope !== "string") continue;
        // A space-joined scope is a descendant selector; its last atom is the
        // thing being colored.
        const atom = scope.trim().split(/\s+/).pop();
        if (atom) scopes.set(atom.toLowerCase(), fg);
      }
    }
  }

  for (const role of ROLE_IDS) {
    if (colors[role]) continue;
    for (const want of VSCODE_SCOPES[role] ?? []) {
      const hit = parseColor(matchScope(scopes, want));
      if (hit) {
        colors[role] = hit;
        break;
      }
    }
  }

  // ── semanticTokenColors ──
  const semantic = isRecord(root.semanticTokenColors) ? root.semanticTokenColors : {};
  for (const role of ROLE_IDS) {
    if (colors[role]) continue;
    for (const key of VSCODE_SEMANTIC[role] ?? []) {
      const raw = semantic[key];
      const value = isRecord(raw) ? raw.foreground : raw;
      const hit = parseColor(typeof value === "string" ? value : null);
      if (hit) {
        colors[role] = hit;
        break;
      }
    }
  }

  if (!Object.keys(colors).length) return null;

  const type = typeof root.type === "string" ? root.type : undefined;
  return {
    format: "vscode",
    name: typeof root.name === "string" ? root.name : undefined,
    appearance: type === "light" || type === "vs" ? "light" : type ? "dark" : undefined,
    colors,
  };
}

export const vscodeParser: Parser = {
  id: "vscode",
  label: "VS Code",
  blurb: "Workbench colors, TextMate scopes, and semantic tokens.",
  detect: (text) =>
    /"tokenColors"|vscode:\/\/schemas\/color-theme|"semanticTokenColors"|"editor\.background"/.test(
      text,
    ),
  parse: parseVsCode,
};

/* -------------------------------------------------------------------------- */
/*                               Vim and Neovim                               */
/* -------------------------------------------------------------------------- */

/**
 * Lua colorschemes almost always define a palette table and then reference it
 * (`fg = c.blue`), so resolve those names before reading the highlight groups.
 * Only `local x = { … }` blocks count as palettes — scraping every
 * `name = "#hex"` in the file would let an inline highlight value shadow the
 * palette entry of the same name.
 */
function luaPalette(text: string): Map<string, string> {
  const palette = new Map<string, string>();
  const re = /\blocal\s+([A-Za-z_][\w]*)\s*=\s*\{/g;

  for (let m = re.exec(text); m; m = re.exec(text)) {
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < text.length && depth > 0; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") depth--;
    }
    const body = text.slice(m.index + m[0].length, i);
    const entry = /(?:\[\s*["']([^"']+)["']\s*\]|([A-Za-z_][\w]*))\s*=\s*["'](#[0-9a-fA-F]{3,8})["']/g;
    for (let e = entry.exec(body); e; e = entry.exec(body)) {
      const key = (e[1] ?? e[2]).toLowerCase();
      if (!palette.has(key)) palette.set(key, e[3]);
      const qualified = `${m[1].toLowerCase()}.${key}`;
      if (!palette.has(qualified)) palette.set(qualified, e[3]);
    }
  }
  return palette;
}

/** `"#aabbcc"` stays put; `c.blue` and `blue` resolve through the palette. */
function luaValue(raw: string, palette: Map<string, string>): string | undefined {
  const v = raw.trim().replace(/,$/, "").trim();
  const quoted = v.match(/^["'](.+)["']$/);
  if (quoted) return quoted[1];
  const ref = v.match(/^[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*$/);
  if (!ref) return undefined;
  return (
    palette.get(v.toLowerCase()) ??
    palette.get(v.split(".").pop()!.toLowerCase())
  );
}

function readLuaSpec(body: string, palette: Map<string, string>): Spec {
  const spec: Spec = {};
  const re = /\b(fg|bg|sp|foreground|background|special)\s*=\s*([^,}]+)/g;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    const channel = (
      { foreground: "fg", background: "bg", special: "sp" } as Record<string, Channel>
    )[m[1]] ?? (m[1] as Channel);
    const value = luaValue(m[2], palette);
    if (value && !spec[channel]) spec[channel] = value;
  }
  return spec;
}

function parseVimish(text: string, format: "vim" | "neovim"): ParseResult | null {
  const groups = new Map<string, Spec>();
  const palette = luaPalette(text);

  const put = (name: string, spec: Spec) => {
    const key = name.toLowerCase();
    const prev = groups.get(key) ?? {};
    groups.set(key, { ...spec, ...prev });
  };

  // ── vimscript: `hi Group guifg=#xxx guibg=#xxx` ──
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(
      /^\s*(?:hi|highlight)!?\s+(?:default\s+|def\s+)?([A-Za-z0-9_@.]+)\s+(.+)$/,
    );
    if (!m || /\blink\b/i.test(m[2])) continue;
    const spec: Spec = {};
    for (const [, key, value] of m[2].matchAll(
      /\b(guifg|guibg|guisp)\s*=\s*(#[0-9a-fA-F]{3,8}|\w+)/g,
    )) {
      const channel = ({ guifg: "fg", guibg: "bg", guisp: "sp" } as const)[
        key as "guifg"
      ];
      spec[channel] = value;
    }
    if (Object.keys(spec).length) put(m[1], spec);
  }

  // ── lua: nvim_set_hl / a local hl() wrapper / a plain group table ──
  const luaForms: RegExp[] = [
    /nvim_set_hl\(\s*\d+\s*,\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g,
    /\b(?:hl|highlight|set_hl)\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g,
    /(?:\[\s*["']([^"']+)["']\s*\]|^[ \t]*([A-Za-z_][\w]*))\s*=\s*\{([^}]*)\}/gm,
  ];
  for (const re of luaForms) {
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const name = m[3] === undefined ? m[1] : (m[1] ?? m[2]);
      const body = m[3] ?? m[2];
      if (!name || !body) continue;
      const spec = readLuaSpec(body, palette);
      if (Object.keys(spec).length) put(name, spec);
    }
  }

  const colors = fromSources(groups, VIM_SOURCES);

  // ── the :terminal palette, which the group tables don't cover ──
  const termList = text.match(/terminal_ansi_colors\s*=\s*\[([^\]]*)\]/);
  if (termList) {
    const list = [...termList[1].matchAll(/["'](#[0-9a-fA-F]{3,8})["']/g)];
    list.slice(0, 16).forEach((hit, i) => {
      const parsed = parseColor(hit[1]);
      if (parsed) colors[ANSI_ORDER[i]] = parsed;
    });
  }
  for (const [, index, value] of text.matchAll(
    /terminal_color_(\d{1,2})["\]]*\s*=\s*([^\s,;}]+)/g,
  )) {
    const slot = Number(index);
    if (slot > 15) continue;
    const resolved = luaValue(value, palette) ?? value;
    const parsed = parseColor(resolved);
    if (parsed) colors[ANSI_ORDER[slot]] = parsed;
  }

  if (!Object.keys(colors).length) return null;

  const bgSetting = text.match(/background\s*=\s*["']?(dark|light)\b/);
  const named =
    text.match(/colors_name\s*=\s*["']([^"']+)["']/) ??
    text.match(/g:colors_name\s*=\s*["']([^"']+)["']/);

  return {
    format,
    name: named?.[1],
    appearance: bgSetting ? (bgSetting[1] as Appearance) : undefined,
    colors,
  };
}

export const neovimParser: Parser = {
  id: "neovim",
  label: "Neovim",
  blurb: "Lua colorscheme — palette table, highlight groups, treesitter captures.",
  detect: (text) =>
    /nvim_set_hl|vim\.api|vim\.g\.|vim\.o\.|terminal_color_\d/.test(text),
  parse: (text) => parseVimish(text, "neovim"),
};

export const vimParser: Parser = {
  id: "vim",
  label: "Vim",
  blurb: "Classic vimscript colorscheme — `hi` lines with `guifg`/`guibg`.",
  detect: (text) => /^\s*(?:hi|highlight)!?\s+\w+.*gui(?:fg|bg)=/m.test(text),
  parse: (text) => parseVimish(text, "vim"),
};

/* -------------------------------------------------------------------------- */
/*                                   Emacs                                    */
/* -------------------------------------------------------------------------- */

/** Take a balanced s-expression starting at `open`, which must index a `(`. */
function sexp(text: string, open: number): string {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
}

function parseEmacs(text: string): ParseResult | null {
  // ── `let` bindings: (bg "#0e1016") ──
  const bindings = new Map<string, string>();
  for (const [, name, hex] of text.matchAll(
    /\(\s*([a-zA-Z][\w-]*)\s+"(#[0-9a-fA-F]{3,8})"\s*\)/g,
  )) {
    if (!bindings.has(name.toLowerCase())) bindings.set(name.toLowerCase(), hex);
  }

  const resolve = (raw: string): string | undefined => {
    const v = raw.trim();
    if (v.startsWith('"')) return v.replace(/^"|"$/g, "");
    return bindings.get(v.replace(/^[,'`]+/, "").toLowerCase());
  };

  // ── face forms: `(face-name ((,class (:foreground ,fg)))) ──
  const faces = new Map<string, Spec>();
  for (const m of text.matchAll(/\(\s*([a-zA-Z][\w-]*)\s+\(\(/g)) {
    const body = sexp(text, m.index);
    const spec: Spec = {};
    const fg = body.match(/:foreground\s+([,'`]?[\w-]+|"[^"]*")/);
    const bg = body.match(/:background\s+([,'`]?[\w-]+|"[^"]*")/);
    if (fg) spec.fg = resolve(fg[1]);
    if (bg) spec.bg = resolve(bg[1]);
    if (spec.fg || spec.bg) faces.set(m[1].toLowerCase(), spec);
  }

  const colors = fromSources(faces, EMACS_FACES);

  // ── ansi-color-names-vector ──
  const vector = text.match(/ansi-color-names-vector\s*\[([^\]]*)\]/);
  if (vector) {
    const list = [...vector[1].matchAll(/"(#[0-9a-fA-F]{3,8})"|,?([\w-]+)/g)];
    list.slice(0, 16).forEach((hit, i) => {
      const parsed = parseColor(hit[1] ?? bindings.get((hit[2] ?? "").toLowerCase()));
      if (parsed) colors[ANSI_ORDER[i]] = parsed;
    });
  }

  if (!Object.keys(colors).length) return null;

  return {
    format: "emacs",
    name: text.match(/\(deftheme\s+([\w-]+)/)?.[1],
    colors,
  };
}

export const emacsParser: Parser = {
  id: "emacs",
  label: "Emacs",
  blurb: "A `deftheme` — `let` bindings resolved through `custom-theme-set-faces`.",
  detect: (text) => /\(deftheme\s|custom-theme-set-faces|font-lock-\w+-face/.test(text),
  parse: parseEmacs,
};
