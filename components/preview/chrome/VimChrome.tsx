"use client";

import { CodeSurface } from "../CodeSurface";
import { Hit, WindowFrame } from "../Hit";
import type { ChromeProps } from "./types";

/**
 * Plain Vim, on purpose. No floats, no signs, no powerline — the `~` filler is
 * visible here because `NonText` is a real color, where Neovim's `EndOfBuffer`
 * is hidden against the background. That difference is exactly why this needs
 * its own preview.
 */
export function VimChrome({
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
      title={`vim ${filename}`}
      dots={[c.error, c.warning, c.success]}
      onPick={onPickRole}
      activeRole={activeRole}
    >
      {/* tabline — TabLine / TabLineSel / TabLineFill */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        className="flex shrink-0 items-stretch font-mono text-[11px]"
        style={{ background: c.bgAlt }}
      >
        <span
          className="px-3 py-1 font-semibold"
          style={{ background: c.bg, color: c.fg }}
          title="TabLineSel"
        >
          1 {filename}
        </span>
        <span className="px-3 py-1" style={{ color: c.fgDim }} title="TabLine">
          2 theme.ts +
        </span>
        <span className="flex-1" title="TabLineFill" />
        <span className="px-2 py-1" style={{ color: c.fgDim }}>
          X
        </span>
      </Hit>

      <div className="flex min-h-0 flex-1">
        <CodeSurface
          theme={theme}
          lang={lang}
          code={code}
          activeRole={activeRole}
          onPickRole={onPickRole}
          cursorLine={9}
          maxLines={22}
          filler={{ count: 28, char: "~", color: c.lineNumber }}
          searchTerm="oklch"
          selectionLines={[13, 14]}
          className="h-full flex-1"
        />
      </div>

      {/* StatusLine */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        active={activeRole === "bgAlt"}
        className="flex shrink-0 items-center gap-2 px-2 py-1 font-mono text-[10.5px]"
        style={{ background: c.bgAlt, color: c.fg }}
        title="StatusLine"
      >
        <span className="font-semibold">
          {filename} <span style={{ color: c.warning }}>[+]</span>
        </span>
        <span style={{ color: c.fgDim }}>[{lang}]</span>
        <span className="ml-auto" style={{ color: c.fgDim }}>
          9,12
        </span>
        <span style={{ color: c.fgDim }}>34%</span>
      </Hit>

      {/* the command line / message row */}
      <Hit
        role="fg"
        onPick={onPickRole}
        className="flex shrink-0 items-center justify-between px-2 py-1 font-mono text-[10.5px]"
        style={{ background: c.bg }}
        title="ModeMsg / message area"
      >
        <span className="font-bold" style={{ color: c.fg }}>
          -- INSERT --
        </span>
        <span style={{ color: c.fgDim }}>
          &quot;{filename}&quot; 48L, 1284B
        </span>
      </Hit>
    </WindowFrame>
  );
}
