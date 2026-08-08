"use client";

import { useMemo } from "react";
import { tokenizeLines } from "@/lib/highlight/tokenize";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";
import { CodeSurface } from "../CodeSurface";
import { Hit, WindowFrame } from "../Hit";
import type { ChromeProps } from "./types";

const TREE = [
  { label: "src", depth: 0, dir: true },
  { label: "color.ts", depth: 1, active: true },
  { label: "theme.ts", depth: 1, git: "M" },
  { label: "export", depth: 1, dir: true },
  { label: "neovim.ts", depth: 2, git: "A" },
  { label: "README.md", depth: 0 },
];

export function VsCodeChrome({
  theme,
  lang,
  code,
  filename,
  activeRole,
  onPickRole,
}: ChromeProps) {
  const c = theme.colors;

  return (
    <WindowFrame
      bg={c.bg}
      border={c.border}
      titleBg={c.bgAlt}
      titleFg={c.fgDim}
      title={`${filename} — themephile`}
      dots={[c.error, c.warning, c.success]}
      onPick={onPickRole}
      activeRole={activeRole}
    >
      <div className="flex min-h-0 flex-1">
        {/* activity bar */}
        <Hit
          role="bgAlt"
          onPick={onPickRole}
          className="hidden w-11 shrink-0 flex-col items-center gap-4 border-r py-3 sm:flex"
          style={{ background: c.bgAlt, borderColor: c.border }}
        >
          {ICONS.map((d, i) => (
            <span key={i} className="relative">
              {i === 0 && (
                <span
                  className="absolute -left-3 top-0 h-full w-[2px]"
                  style={{ background: c.accent }}
                />
              )}
              <svg
                viewBox="0 0 24 24"
                className="size-[18px]"
                fill="none"
                stroke={i === 0 ? c.fg : c.fgDim}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={d} />
              </svg>
              {i === 2 && (
                <span
                  className="absolute -right-1.5 -bottom-1 grid size-3.5 place-items-center rounded-full text-[8px] font-bold"
                  style={{ background: c.accent, color: c.bg }}
                >
                  3
                </span>
              )}
            </span>
          ))}
        </Hit>

        {/* explorer */}
        <Hit
          role="bgAlt"
          onPick={onPickRole}
          className="hidden w-44 shrink-0 flex-col border-r py-2 font-mono text-[11px] lg:flex"
          style={{ background: c.bgAlt, borderColor: c.border }}
        >
          <div
            className="px-3 pb-2 text-[9px] tracking-[0.14em] uppercase"
            style={{ color: c.lineNumber }}
          >
            Explorer
          </div>
          {TREE.map((item) => (
            <div
              key={item.label + item.depth}
              className="flex items-center gap-1 truncate py-[3px] pr-2"
              style={{
                paddingLeft: 12 + item.depth * 12,
                color: item.git
                  ? item.git === "A"
                    ? c.success
                    : c.warning
                  : item.active
                    ? c.fg
                    : c.fgDim,
                background: item.active ? c.selection : "transparent",
              }}
            >
              <span style={{ color: item.dir ? c.fgDim : "inherit" }}>
                {item.dir ? "▾" : " "}
              </span>
              {item.label}
              {item.git && <span className="ml-auto shrink-0">{item.git}</span>}
            </div>
          ))}
        </Hit>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* tabs */}
          <div
            className="flex shrink-0 items-stretch border-b font-mono text-[11px]"
            style={{ background: c.bgAlt, borderColor: c.border }}
          >
            {[filename, "theme.ts"].map((name, i) => (
              <div
                key={name}
                className="relative border-r px-3 py-2"
                style={{
                  background: i === 0 ? c.bg : "transparent",
                  color: i === 0 ? c.fg : c.fgDim,
                  borderColor: c.border,
                }}
              >
                {i === 0 && (
                  <span
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: c.accent }}
                  />
                )}
                {name}
                {i === 1 && <span style={{ color: c.warning }}> ●</span>}
              </div>
            ))}
          </div>

          {/* breadcrumbs */}
          <div
            className="flex shrink-0 items-center gap-1.5 px-3 py-1 font-mono text-[10px]"
            style={{ background: c.bg, color: c.fgDim }}
          >
            src <span style={{ color: c.lineNumber }}>›</span> {filename}{" "}
            <span style={{ color: c.lineNumber }}>›</span>{" "}
            <span style={{ color: c.function }}>useTheme</span>
          </div>

          <div className="flex min-h-0 flex-1">
            <CodeSurface
              theme={theme}
              lang={lang}
              code={code}
              activeRole={activeRole}
              onPickRole={onPickRole}
              cursorLine={9}
              className="h-full flex-1"
            />
            <Minimap theme={theme} lang={lang} code={code} />
          </div>
        </div>
      </div>

      {/* status bar */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        active={activeRole === "bgAlt"}
        className="flex shrink-0 items-center gap-3 border-t px-0 font-mono text-[10px]"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        <span
          className="px-2 py-1.5 font-medium"
          style={{ background: c.accent, color: c.bg }}
        >
          ⧉
        </span>
        <span style={{ color: c.fgDim }}>⑂ main*</span>
        <span style={{ color: c.error }}>⊗ 2</span>
        <span style={{ color: c.warning }}>⚠ 5</span>
        <span className="ml-auto pr-3" style={{ color: c.fgDim }}>
          Ln 9, Col 12 · Spaces: 2 · UTF-8 · LF · TypeScript
        </span>
      </Hit>
    </WindowFrame>
  );
}

const ICONS = [
  "M4 4h6l2 2h8v12H4z", // files
  "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 16-5-5", // search
  "M7 4v12M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 0v2a4 4 0 0 1-4 4H9", // git
  "M5 4l14 8-14 8z", // run
  "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", // extensions
];

/**
 * A real minimap: each line's tokens become tiny bars in their own colors, so
 * the palette's overall rhythm is visible at a glance.
 */
function Minimap({ theme, lang, code }: { theme: Theme; lang: string; code: string }) {
  const lines = useMemo(
    () => tokenizeLines(code, lang as Parameters<typeof tokenizeLines>[1]).slice(0, 90),
    [code, lang],
  );

  return (
    <div
      aria-hidden
      className="hidden w-14 shrink-0 flex-col gap-[1px] overflow-hidden border-l py-2 pl-1 md:flex"
      style={{ background: theme.colors.bg, borderColor: theme.colors.border }}
    >
      {lines.map((tokens, i) => (
        <div key={i} className="flex h-[2px] gap-[1px]">
          {tokens.slice(0, 14).map((t, j) => {
            const width = Math.min(14, Math.max(1, t.text.trim().length)) * 1.1;
            if (!t.text.trim()) return <span key={j} style={{ width }} />;
            return (
              <span
                key={j}
                style={{
                  width,
                  background:
                    theme.colors[
                      (t.role === "fg" ? "fg" : t.role) as RoleId
                    ],
                  opacity: 0.75,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
