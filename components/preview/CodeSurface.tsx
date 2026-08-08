"use client";

import { useMemo, type ReactNode } from "react";
import { tokenizeLines, type LangId, type SyntaxRole } from "@/lib/highlight/tokenize";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

export type Sign = { text: string; color: string; title?: string };

type Props = {
  theme: Theme;
  lang: LangId;
  code: string;
  /** Highlights every token using this role — answers "where does this show up?" */
  activeRole?: RoleId | null;
  onPickRole?: (role: RoleId) => void;
  /** Vim and Neovim count lines differently; Emacs and VS Code just count up. */
  lineNumbers?: "absolute" | "relative" | "none";
  /** 1-indexed line painted with `currentLine`. */
  cursorLine?: number;
  /** Neovim's sign column: git marks and diagnostic letters. */
  sign?: (line: number) => Sign | null;
  /** Diagnostic virtual text pinned to the end of a line. */
  annotations?: Record<number, { text: string; color: string }>;
  /** Lines painted with the selection color — stands in for a visual region. */
  selectionLines?: number[];
  /** Every token matching this word gets the search-match background. */
  searchTerm?: string;
  /** Vim's `~` past the end of the buffer. Neovim hides these by default. */
  filler?: { count: number; char: string; color: string };
  /** Trim the sample so a short pane doesn't cut mid-expression. */
  maxLines?: number;
  fontSize?: number;
  className?: string;
  /** Rendered over the surface — completion popups, minimaps. */
  overlay?: ReactNode;
  gutterWidth?: string;
};

export function CodeSurface({
  theme,
  lang,
  code,
  activeRole = null,
  onPickRole,
  lineNumbers = "absolute",
  cursorLine,
  sign,
  annotations,
  selectionLines,
  searchTerm,
  filler,
  maxLines,
  fontSize = 13,
  className = "",
  overlay,
  gutterWidth = "3.5rem",
}: Props) {
  const lines = useMemo(() => {
    const all = tokenizeLines(code, lang);
    return maxLines ? all.slice(0, maxLines) : all;
  }, [code, lang, maxLines]);

  const c = theme.colors;
  const interactive = Boolean(onPickRole);
  const selected = new Set(selectionLines ?? []);

  const gutterFor = (lineNo: number) => {
    if (lineNumbers === "none") return null;
    if (lineNumbers === "absolute" || !cursorLine) return lineNo;
    // Relative numbering: distance from the cursor, absolute on the cursor line.
    return lineNo === cursorLine ? lineNo : Math.abs(lineNo - cursorLine);
  };

  return (
    <div
      className={`relative overflow-auto font-mono ${className}`}
      style={{
        background: c.bg,
        color: c.fg,
        fontSize,
        lineHeight: 1.65,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
      }}
    >
      <div className="min-w-max py-2">
        {lines.map((tokens, i) => {
          const lineNo = i + 1;
          const isCursor = cursorLine === lineNo;
          const rowBg = selected.has(lineNo)
            ? c.selection
            : isCursor
              ? c.currentLine
              : undefined;
          const mark = sign?.(lineNo) ?? null;

          return (
            <div key={i} className="flex" style={rowBg ? { background: rowBg } : undefined}>
              {sign && (
                <span
                  aria-hidden
                  className="sticky left-0 w-6 shrink-0 select-none text-center"
                  style={{ background: rowBg ?? c.bg, color: mark?.color }}
                  title={mark?.title}
                >
                  {mark?.text ?? " "}
                </span>
              )}

              {lineNumbers !== "none" && (
                <span
                  aria-hidden
                  className="shrink-0 select-none pr-4 pl-3 text-right tabular-nums"
                  style={{
                    minWidth: gutterWidth,
                    color: isCursor ? c.lineNumberActive : c.lineNumber,
                    background: rowBg ?? c.bg,
                  }}
                >
                  {gutterFor(lineNo)}
                </span>
              )}

              <code className="whitespace-pre pr-8">
                {tokens.map((token, j) => {
                  const role = roleFor(token.role);
                  const blank = !token.text.trim();
                  // A real search highlights the matched word, not the line.
                  const hit = searchTerm && token.text.trim() === searchTerm;
                  const style = {
                    color: c[role],
                    ...(hit ? { background: c.matchBg } : null),
                  };
                  if (!interactive || blank) {
                    return (
                      <span key={j} style={style}>
                        {token.text}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={j}
                      className="tok"
                      role="button"
                      tabIndex={-1}
                      data-active={activeRole === role || undefined}
                      title={hit ? `${role} · search match` : role}
                      style={style}
                      onClick={() => onPickRole?.(hit ? "matchBg" : role)}
                    >
                      {token.text}
                    </span>
                  );
                })}
                {tokens.length === 0 && " "}
                {annotations?.[lineNo] && (
                  <span
                    className="pl-6 italic"
                    style={{ color: annotations[lineNo].color }}
                  >
                    ■ {annotations[lineNo].text}
                  </span>
                )}
              </code>
            </div>
          );
        })}

        {filler &&
          Array.from({ length: filler.count }, (_, i) => (
            <div key={`filler-${i}`} className="flex">
              {sign && <span className="w-6 shrink-0" />}
              <span
                aria-hidden
                className="shrink-0 select-none pl-3"
                style={{ minWidth: gutterWidth, color: filler.color }}
              >
                {filler.char}
              </span>
            </div>
          ))}
      </div>

      {overlay}
    </div>
  );
}

/** Tokenizer roles line up with theme roles, except plain text. */
function roleFor(role: SyntaxRole): RoleId {
  return role === "fg" ? "fg" : (role as RoleId);
}
