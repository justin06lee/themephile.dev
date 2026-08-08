"use client";

import { useMemo } from "react";
import { tokenizeLines, type LangId, type SyntaxRole } from "@/lib/highlight/tokenize";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

type Props = {
  theme: Theme;
  lang: LangId;
  code: string;
  /** Highlights every token using this role — makes "where does this show up?" answerable. */
  activeRole?: RoleId | null;
  onPickRole?: (role: RoleId) => void;
  showGutter?: boolean;
  /** 1-indexed line to paint with the `currentLine` color. */
  cursorLine?: number;
  fontSize?: number;
  className?: string;
};

export function CodeSurface({
  theme,
  lang,
  code,
  activeRole = null,
  onPickRole,
  showGutter = true,
  cursorLine,
  fontSize = 13,
  className = "",
}: Props) {
  const lines = useMemo(() => tokenizeLines(code, lang), [code, lang]);
  const c = theme.colors;
  const interactive = Boolean(onPickRole);

  return (
    <div
      className={`overflow-auto font-mono ${className}`}
      style={{
        background: c.bg,
        color: c.fg,
        fontSize,
        lineHeight: 1.65,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
      }}
    >
      <div className="min-w-max py-3">
        {lines.map((tokens, i) => {
          const lineNo = i + 1;
          const isCursor = cursorLine === lineNo;
          return (
            <div
              key={i}
              className="flex"
              style={isCursor ? { background: c.currentLine } : undefined}
            >
              {showGutter && (
                <span
                  aria-hidden
                  className="sticky left-0 select-none pr-4 pl-4 text-right tabular-nums"
                  style={{
                    minWidth: "3.5rem",
                    color: isCursor ? c.lineNumberActive : c.lineNumber,
                    background: isCursor ? c.currentLine : c.bg,
                  }}
                >
                  {lineNo}
                </span>
              )}
              <code className="whitespace-pre pr-8">
                {tokens.map((token, j) => {
                  const role = roleFor(token.role);
                  const blank = !token.text.trim();
                  if (!interactive || blank) {
                    return (
                      <span key={j} style={{ color: c[role] }}>
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
                      title={role}
                      style={{ color: c[role] }}
                      onClick={() => onPickRole?.(role)}
                    >
                      {token.text}
                    </span>
                  );
                })}
                {tokens.length === 0 && " "}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Tokenizer roles line up with theme roles, except plain text. */
function roleFor(role: SyntaxRole): RoleId {
  return role === "fg" ? "fg" : (role as RoleId);
}
