"use client";

import { CodeSurface } from "../CodeSurface";
import { Hit, WindowFrame } from "../Hit";
import type { ChromeProps } from "./types";

/**
 * Emacs has no tab bar and no status bar in the other editors' sense — it has a
 * boxed mode line and an echo area, plus fringes either side of the buffer.
 * Those three are where an Emacs theme lives or dies.
 */
export function EmacsChrome({
  theme,
  lang,
  code,
  filename,
  activeRole,
  onPickRole,
}: ChromeProps) {
  const c = theme.colors;
  const modeName =
    { tsx: "TypeScript", python: "Python", rust: "Rustic", go: "Go", lua: "Lua", css: "CSS" }[
      lang
    ] ?? "Fundamental";

  return (
    <WindowFrame
      bg={c.bg}
      border={c.border}
      titleBg={c.bgAlt}
      titleFg={c.fgDim}
      title={`emacs@${filename}`}
      dots={[c.error, c.warning, c.success]}
      onPick={onPickRole}
      activeRole={activeRole}
    >
      {/* header-line */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        className="shrink-0 px-3 py-1 font-mono text-[10px]"
        style={{ background: c.bgAlt, color: c.fgDim }}
        title="header-line"
      >
        ~/code/themephile/src/{filename}
      </Hit>

      <div className="flex min-h-0 flex-1">
        {/* left fringe */}
        <Hit
          role="border"
          onPick={onPickRole}
          className="w-3 shrink-0 pt-2 text-center font-mono text-[9px]"
          style={{ background: c.bg, color: c.fgDim }}
          title="fringe"
        >
          <div style={{ color: c.warning }}>»</div>
        </Hit>

        <CodeSurface
          theme={theme}
          lang={lang}
          code={code}
          activeRole={activeRole}
          onPickRole={onPickRole}
          cursorLine={9}
          selectionLines={[13, 14, 15]}
          className="h-full flex-1"
          gutterWidth="3rem"
        />

        <Hit
          role="border"
          onPick={onPickRole}
          className="w-3 shrink-0"
          style={{ background: c.bg }}
          title="fringe"
        />
      </div>

      {/* mode-line — boxed, which is the Emacs tell */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        active={activeRole === "bgAlt"}
        className="flex shrink-0 items-center gap-3 px-2 py-[3px] font-mono text-[10.5px]"
        style={{
          background: c.bgAlt,
          color: c.fgDim,
          boxShadow: `inset 0 0 0 1px ${c.border}`,
        }}
        title="mode-line"
      >
        <span>-UUU:----F1</span>
        <span className="font-bold" style={{ color: c.accent }} title="mode-line-buffer-id">
          {filename}
        </span>
        <span>All L9</span>
        <span>({modeName} Flymake</span>
        <span style={{ color: c.error }}>1</span>
        <span>/</span>
        <span style={{ color: c.warning }}>2</span>
        <span>)</span>
        <span className="ml-auto">--- 34%</span>
      </Hit>

      {/* echo area / minibuffer */}
      <Hit
        role="fg"
        onPick={onPickRole}
        className="flex shrink-0 items-center gap-2 px-2 py-1 font-mono text-[10.5px]"
        style={{ background: c.bg }}
        title="minibuffer / echo area"
      >
        <span style={{ color: c.accent }} title="minibuffer-prompt">
          M-x
        </span>
        <span style={{ color: c.fg }}>load-theme</span>
        <span style={{ color: c.string }}>RET</span>
        <span
          className="ml-1 inline-block w-[6px]"
          style={{ background: c.cursor, height: "1em" }}
        />
        <span className="ml-auto italic" style={{ color: c.success }}>
          Wrote ~/.emacs.d/themes/{filename}
        </span>
      </Hit>
    </WindowFrame>
  );
}
