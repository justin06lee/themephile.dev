/**
 * A small hand-rolled tokenizer.
 *
 * Off-the-shelf highlighters emit TextMate scopes, and mapping ~2000 scopes
 * onto 16 editable roles is guesswork in the wrong direction. Here every token
 * is *born* as a role, so clicking a token in the preview and clicking its
 * swatch in the sidebar are the same action. It's approximate — no parser —
 * but it only has to be convincing enough to judge a color by.
 */

export type SyntaxRole =
  | "comment"
  | "keyword"
  | "storage"
  | "string"
  | "escape"
  | "number"
  | "constant"
  | "function"
  | "type"
  | "variable"
  | "parameter"
  | "property"
  | "operator"
  | "punctuation"
  | "tag"
  | "attribute"
  | "fg";

export type Token = { text: string; role: SyntaxRole };

export type LangId = "tsx" | "python" | "rust" | "go" | "lua" | "css";

type LangSpec = {
  id: LangId;
  label: string;
  filename: string;
  lineComment: string[];
  blockComment?: [string, string];
  /** Triple-quoted or long-bracket strings, checked before normal quotes. */
  longStrings?: [string, string][];
  quotes: string[];
  rawStringPrefix?: RegExp;
  keywords: Set<string>;
  storage: Set<string>;
  constants: Set<string>;
  builtinTypes: Set<string>;
  /** Keywords that introduce a `(param, list)` we should tint as parameters. */
  declKeywords: Set<string>;
  jsx?: boolean;
  /** e.g. Python `@decorator`, Rust `#[attr]` */
  attributeRe?: RegExp;
  templateQuote?: string;
};

const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const SPECS: Record<LangId, LangSpec> = {
  tsx: {
    id: "tsx",
    label: "TypeScript",
    filename: "use-theme.tsx",
    lineComment: ["//"],
    blockComment: ["/*", "*/"],
    quotes: ['"', "'", "`"],
    templateQuote: "`",
    jsx: true,
    attributeRe: /@[A-Za-z_$][\w$]*/y,
    keywords: set(`
      if else for while do switch case default break continue return throw try
      catch finally new delete typeof instanceof in of void yield await import
      from export as satisfies keyof infer extends implements is asserts using
    `),
    storage: set(`
      const let var function class interface type enum namespace declare abstract
      static readonly public private protected async get set constructor super this
    `),
    constants: set("true false null undefined NaN Infinity"),
    builtinTypes: set(`
      string number boolean object symbol bigint any unknown never Array Promise
      Record Map Set Partial Readonly Pick Omit ReturnType React JSX
    `),
    declKeywords: set("function constructor"),
  },
  python: {
    id: "python",
    label: "Python",
    filename: "palette.py",
    lineComment: ["#"],
    longStrings: [
      ['"""', '"""'],
      ["'''", "'''"],
    ],
    quotes: ['"', "'"],
    rawStringPrefix: /[rRbBfFuU]{1,2}(?=['"])/y,
    attributeRe: /@[A-Za-z_][\w.]*/y,
    keywords: set(`
      if elif else for while break continue return yield raise try except finally
      with as import from pass assert del global nonlocal in is not and or await
      match case
    `),
    storage: set("def class lambda async self cls"),
    constants: set("True False None Ellipsis NotImplemented __name__ __main__"),
    builtinTypes: set(`
      int float str bool bytes list dict tuple set frozenset type object
      Optional Sequence Iterable Callable Any Union Literal
    `),
    declKeywords: set("def lambda"),
  },
  rust: {
    id: "rust",
    label: "Rust",
    filename: "oklch.rs",
    lineComment: ["//"],
    blockComment: ["/*", "*/"],
    quotes: ['"'],
    attributeRe: /#!?\[[^\]]*\]/y,
    keywords: set(`
      if else match loop while for in break continue return where as use crate
      self super move ref dyn unsafe await async box yield
    `),
    storage: set(`
      let mut const static fn struct enum trait impl type mod pub extern union
    `),
    constants: set("true false None Some Ok Err"),
    builtinTypes: set(`
      u8 u16 u32 u64 u128 usize i8 i16 i32 i64 i128 isize f32 f64 bool char str
      String Vec Option Result Box Rc Arc HashMap
    `),
    declKeywords: set("fn"),
  },
  go: {
    id: "go",
    label: "Go",
    filename: "theme.go",
    lineComment: ["//"],
    blockComment: ["/*", "*/"],
    quotes: ['"', "`"],
    keywords: set(`
      if else for range switch case default break continue return go defer select
      fallthrough goto import package
    `),
    storage: set("func var const type struct interface map chan"),
    constants: set("true false nil iota"),
    builtinTypes: set(`
      string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 uintptr
      byte rune float32 float64 complex64 complex128 bool error any
    `),
    declKeywords: set("func"),
  },
  lua: {
    id: "lua",
    label: "Lua",
    filename: "colorscheme.lua",
    lineComment: ["--"],
    longStrings: [["[[", "]]"]],
    quotes: ['"', "'"],
    keywords: set(`
      if then elseif else end for while repeat until do in break return goto not
      and or
    `),
    storage: set("local function"),
    constants: set("true false nil"),
    builtinTypes: set("vim string table math os io pairs ipairs require tostring tonumber type"),
    declKeywords: set("function"),
  },
  css: {
    id: "css",
    label: "CSS",
    filename: "tokens.css",
    lineComment: [],
    blockComment: ["/*", "*/"],
    quotes: ['"', "'"],
    keywords: set(""),
    storage: set(""),
    constants: set(""),
    builtinTypes: set(""),
    declKeywords: set(""),
  },
};

export const LANGUAGES = (Object.keys(SPECS) as LangId[]).map((id) => ({
  id,
  label: SPECS[id].label,
  filename: SPECS[id].filename,
}));

/* -------------------------------------------------------------------------- */
/*                                  scanner                                   */
/* -------------------------------------------------------------------------- */

const WS = /\s+/y;
const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER =
  /0[xXbBoO][0-9a-fA-F_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d+)?(?:[a-zA-Z_][\w]*)?/y;
const OPERATOR = /[+\-*/%=<>!&|^~?:.]+/y;
const PUNCT = /[()[\]{},;]/y;

const at = (src: string, i: number, s: string) => src.startsWith(s, i);

function match(re: RegExp, src: string, i: number): string | null {
  re.lastIndex = i;
  const m = re.exec(src);
  return m && m.index === i ? m[0] : null;
}

class Emitter {
  tokens: Token[] = [];
  push(text: string, role: SyntaxRole) {
    if (!text) return;
    const last = this.tokens[this.tokens.length - 1];
    if (last && last.role === role) last.text += text;
    else this.tokens.push({ text, role });
  }
}

/** Classify a bare identifier from its neighbors. Heuristic, deliberately. */
function classifyIdent(
  word: string,
  spec: LangSpec,
  prevChar: string,
  nextChar: string,
  inParams: boolean,
): SyntaxRole {
  if (spec.keywords.has(word)) return "keyword";
  if (spec.storage.has(word)) return "storage";
  if (spec.constants.has(word)) return "constant";
  if (spec.builtinTypes.has(word)) return "type";
  if (nextChar === "(") return "function";
  if (inParams) return "parameter";
  if (prevChar === ".") return "property";
  // `key:` is a property — but in TS that shape is also a ternary's else-branch,
  // so there it only counts right after `{` or `,`.
  if (nextChar === ":" && (spec.id !== "tsx" || prevChar === "{" || prevChar === ","))
    return "property";
  if (/^[A-Z][A-Z0-9_]*$/.test(word) && word.length > 1) return "constant";
  if (/^[A-Z]/.test(word)) return "type";
  return "variable";
}

function scanString(
  src: string,
  start: number,
  quote: string,
  spec: LangSpec,
  out: Emitter,
): number {
  const isTemplate = quote === spec.templateQuote;
  const isRaw = spec.id === "go" && quote === "`";
  let i = start + quote.length;
  let buf = quote;

  while (i < src.length) {
    const c = src[i];
    if (!isRaw && c === "\\") {
      out.push(buf, "string");
      buf = "";
      out.push(src.slice(i, i + 2), "escape");
      i += 2;
      continue;
    }
    if (isTemplate && c === "$" && src[i + 1] === "{") {
      const end = src.indexOf("}", i);
      const stop = end === -1 ? src.length : end + 1;
      out.push(buf, "string");
      buf = "";
      out.push(src.slice(i, stop), "escape");
      i = stop;
      continue;
    }
    if (c === quote) {
      buf += c;
      i++;
      out.push(buf, "string");
      return i;
    }
    if (c === "\n" && !isTemplate && !isRaw) break; // unterminated; bail politely
    buf += c;
    i++;
  }
  out.push(buf, "string");
  return i;
}

function tokenizeGeneric(src: string, spec: LangSpec): Token[] {
  const out = new Emitter();
  let i = 0;
  let prevChar = "";
  // Depth tracking for the `(a, b)` right after `fn`/`def`/`function`.
  let paramDepth = 0;
  let pendingParams = false;
  // JSX: `elementDepth` counts open elements so children and closing tags are
  // still recognized as markup; `inTagHead` means we're between `<name` and `>`.
  let elementDepth = 0;
  let inTagHead = false;
  let closingTag = false;

  while (i < src.length) {
    const c = src[i];

    const ws = match(WS, src, i);
    if (ws) {
      out.push(ws, "fg");
      i += ws.length;
      continue;
    }

    // ── comments ──
    const line = spec.lineComment.find((p) => at(src, i, p));
    if (line) {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      out.push(src.slice(i, stop), "comment");
      i = stop;
      continue;
    }
    if (spec.blockComment && at(src, i, spec.blockComment[0])) {
      const end = src.indexOf(spec.blockComment[1], i + 2);
      const stop = end === -1 ? src.length : end + spec.blockComment[1].length;
      out.push(src.slice(i, stop), "comment");
      i = stop;
      continue;
    }

    // ── attributes / decorators ──
    if (spec.attributeRe) {
      const attr = match(spec.attributeRe, src, i);
      if (attr) {
        out.push(attr, "attribute");
        i += attr.length;
        prevChar = attr[attr.length - 1];
        continue;
      }
    }

    // ── long strings (docstrings, [[ ]]) ──
    const long = spec.longStrings?.find(([open]) => at(src, i, open));
    if (long) {
      const end = src.indexOf(long[1], i + long[0].length);
      const stop = end === -1 ? src.length : end + long[1].length;
      out.push(src.slice(i, stop), "string");
      i = stop;
      continue;
    }

    // ── strings (with optional r"" / f"" prefixes) ──
    if (spec.rawStringPrefix) {
      const pre = match(spec.rawStringPrefix, src, i);
      if (pre) {
        out.push(pre, "escape");
        i += pre.length;
        continue;
      }
    }
    if (spec.quotes.includes(c)) {
      i = scanString(src, i, c, spec, out);
      prevChar = c;
      continue;
    }

    // ── JSX ──
    if (spec.jsx && c === "<") {
      const isClosing = src[i + 1] === "/";
      const nameMatch = /^\/?[A-Za-z][\w.]*/.exec(src.slice(i + 1));
      // `<` starts markup only where an expression can start — otherwise it's
      // less-than or a generic argument list.
      const openable =
        prevChar === "" ||
        /[({=>,:&|?]/.test(prevChar) ||
        ["return", "=>"].includes(prevWordOf(out));
      if (nameMatch && (isClosing ? elementDepth > 0 : openable || elementDepth > 0)) {
        out.push("<", "punctuation");
        i++;
        if (isClosing) {
          out.push("/", "punctuation");
          i++;
        }
        const name = match(/[A-Za-z][\w.]*/y, src, i) ?? "";
        out.push(name, "tag");
        i += name.length;
        inTagHead = true;
        closingTag = isClosing;
        prevChar = ">";
        continue;
      }
    }
    if (spec.jsx && inTagHead && (c === ">" || (c === "/" && src[i + 1] === ">"))) {
      const selfClosing = c === "/";
      out.push(selfClosing ? "/>" : ">", "punctuation");
      i += selfClosing ? 2 : 1;
      if (!selfClosing) {
        elementDepth = closingTag
          ? Math.max(0, elementDepth - 1)
          : elementDepth + 1;
      }
      inTagHead = false;
      closingTag = false;
      prevChar = ">";
      continue;
    }

    // ── numbers ──
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const num = match(NUMBER, src, i);
      if (num) {
        out.push(num, "number");
        i += num.length;
        prevChar = num[num.length - 1];
        continue;
      }
    }

    // ── identifiers ──
    const word = match(IDENT, src, i);
    if (word) {
      let j = i + word.length;
      while (j < src.length && /[ \t]/.test(src[j])) j++;
      const nextChar = src[j] ?? "";

      let role: SyntaxRole;
      if (inTagHead) {
        role = "attribute";
      } else {
        role = classifyIdent(word, spec, prevChar, nextChar, paramDepth > 0);
        // The name right after `fn`/`def`/`function` is the declaration itself.
        if (role === "variable" || role === "parameter") {
          const prevWord = [...out.tokens]
            .reverse()
            .find((t) => t.role !== "fg" && t.text.trim())?.text;
          if (prevWord && spec.declKeywords.has(prevWord.trim())) role = "function";
        }
      }
      if (role === "function" && spec.declKeywords.has(prevWordOf(out))) {
        pendingParams = true;
      } else if (spec.declKeywords.has(word)) {
        pendingParams = true;
      }

      out.push(word, role);
      i += word.length;
      prevChar = word[word.length - 1];
      continue;
    }

    // ── brackets, tracking the parameter list ──
    const punct = match(PUNCT, src, i);
    if (punct) {
      if (punct === "(") {
        if (pendingParams && paramDepth === 0) {
          paramDepth = 1;
          pendingParams = false;
        } else if (paramDepth > 0) {
          paramDepth++;
        }
      } else if (punct === ")" && paramDepth > 0) {
        paramDepth--;
      }
      out.push(punct, "punctuation");
      i += punct.length;
      prevChar = punct;
      continue;
    }

    const op = match(OPERATOR, src, i);
    if (op) {
      out.push(op, "operator");
      i += op.length;
      prevChar = op[op.length - 1];
      continue;
    }

    out.push(c, "fg");
    i++;
    prevChar = c;
  }

  return out.tokens;
}

function prevWordOf(out: Emitter): string {
  for (let k = out.tokens.length - 1; k >= 0; k--) {
    const t = out.tokens[k];
    if (t.role === "fg" && !t.text.trim()) continue;
    return t.text.trim();
  }
  return "";
}

/* -------------------------------------------------------------------------- */
/*                                    CSS                                     */
/* -------------------------------------------------------------------------- */

function tokenizeCss(src: string): Token[] {
  const out = new Emitter();
  let i = 0;
  let inBlock = false;
  let inValue = false;

  while (i < src.length) {
    const c = src[i];

    const ws = match(WS, src, i);
    if (ws) {
      out.push(ws, "fg");
      i += ws.length;
      continue;
    }
    if (at(src, i, "/*")) {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out.push(src.slice(i, stop), "comment");
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      i = scanString(src, i, c, SPECS.css, out);
      continue;
    }
    if (c === "@") {
      const kw = /@[\w-]+/y;
      const m = match(kw, src, i) ?? "@";
      out.push(m, "keyword");
      i += m.length;
      continue;
    }
    if (c === "#" && /^#[0-9a-fA-F]{3,8}\b/.test(src.slice(i))) {
      const m = /#[0-9a-fA-F]{3,8}/y;
      const hex = match(m, src, i)!;
      out.push(hex, "constant");
      i += hex.length;
      continue;
    }
    if (!inBlock && (c === "." || c === "#")) {
      const m = /[.#][\w-]+/y;
      const sel = match(m, src, i) ?? c;
      out.push(sel, "type");
      i += sel.length;
      continue;
    }
    if (c === ":" && !inValue && !inBlock) {
      const m = /::?[\w-]+(\([^)]*\))?/y;
      const pseudo = match(m, src, i) ?? ":";
      out.push(pseudo, "attribute");
      i += pseudo.length;
      continue;
    }
    if (c === "{") {
      inBlock = true;
      out.push(c, "punctuation");
      i++;
      continue;
    }
    if (c === "}") {
      inBlock = false;
      inValue = false;
      out.push(c, "punctuation");
      i++;
      continue;
    }
    if (c === ":" && inBlock) {
      inValue = true;
      out.push(c, "punctuation");
      i++;
      continue;
    }
    if (c === ";") {
      inValue = false;
      out.push(c, "punctuation");
      i++;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "-" && /[0-9.]/.test(src[i + 1] ?? ""))) {
      const m = /-?[\d.]+(?:%|[a-z]{1,4})?/y;
      const num = match(m, src, i);
      if (num) {
        out.push(num, "number");
        i += num.length;
        continue;
      }
    }
    if (at(src, i, "--")) {
      const m = /--[\w-]+/y;
      const v = match(m, src, i)!;
      out.push(v, "property");
      i += v.length;
      continue;
    }

    const word = match(/[\w-]+/y, src, i);
    if (word) {
      let j = i + word.length;
      while (j < src.length && /[ \t]/.test(src[j])) j++;
      const next = src[j] ?? "";
      let role: SyntaxRole;
      if (next === "(") role = "function";
      else if (inValue) role = "constant";
      else if (inBlock) role = "property";
      else role = "tag";
      out.push(word, role);
      i += word.length;
      continue;
    }

    if (/[(),]/.test(c)) {
      out.push(c, "punctuation");
      i++;
      continue;
    }
    out.push(c, "operator");
    i++;
  }
  return out.tokens;
}

/* -------------------------------------------------------------------------- */
/*                                   public                                   */
/* -------------------------------------------------------------------------- */

export function tokenize(code: string, lang: LangId): Token[] {
  return lang === "css" ? tokenizeCss(code) : tokenizeGeneric(code, SPECS[lang]);
}

/** Tokens split into lines, so the preview can render a gutter. */
export function tokenizeLines(code: string, lang: LangId): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(code, lang)) {
    const parts = token.text.split("\n");
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, role: token.role });
    });
  }
  return lines;
}
