"use client";

import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";
import { CodeSurface, type Sign } from "../CodeSurface";
import { Hit, WindowFrame } from "../Hit";
import type { ChromeProps } from "./types";

/** Powerline arrow drawn as a shape — browsers have no Nerd Font. */
function Arrow({ from, to }: { from: string; to: string }) {
  return (
    <span aria-hidden className="self-stretch" style={{ background: to, width: 9 }}>
      <span
        className="block h-full w-full"
        style={{ background: from, clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
      />
    </span>
  );
}

function ArrowBack({ from, to }: { from: string; to: string }) {
  return (
    <span aria-hidden className="self-stretch" style={{ background: to, width: 9 }}>
      <span
        className="block h-full w-full"
        style={{ background: from, clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }}
      />
    </span>
  );
}

const CURSOR_LINE = 9;

export function NeovimChrome({
  theme,
  lang,
  code,
  filename,
  activeRole,
  onPickRole,
}: ChromeProps) {
  const c = theme.colors;

  // Git signs and diagnostics in the sign column — the thing you stare at all day.
  const sign = (line: number): Sign | null => {
    if (line === 4) return { text: "│", color: c.success, title: "GitSignsAdd" };
    if (line === 5) return { text: "│", color: c.success, title: "GitSignsAdd" };
    if (line === 9) return { text: "│", color: c.warning, title: "GitSignsChange" };
    if (line === 18) return { text: "E", color: c.error, title: "DiagnosticSignError" };
    if (line === 21) return { text: "W", color: c.warning, title: "DiagnosticSignWarn" };
    if (line === 12) return { text: "_", color: c.error, title: "GitSignsDelete" };
    return null;
  };

  return (
    <WindowFrame
      bg={c.bg}
      border={c.border}
      titleBg={c.bgAlt}
      titleFg={c.fgDim}
      title={`nvim ${filename}`}
      dots={[c.error, c.warning, c.success]}
      onPick={onPickRole}
      activeRole={activeRole}
    >
      {/* tabline */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        className="flex shrink-0 items-stretch border-b font-mono text-[11px]"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        <span
          className="flex items-center px-3 py-1.5 font-semibold"
          style={{ background: c.bg, color: c.fg }}
        >
          {filename}
        </span>
        <span className="flex items-center px-3 py-1.5" style={{ color: c.fgDim }}>
          theme.ts <span style={{ color: c.warning }}>●</span>
        </span>
        <span className="ml-auto flex items-center px-3" style={{ color: c.lineNumber }}>
          Tab 1/2
        </span>
      </Hit>

      {/* winbar */}
      <div
        className="shrink-0 px-3 py-1 font-mono text-[10px]"
        style={{ background: c.bg, color: c.fgDim }}
      >
        src › <span style={{ color: c.function }}>{filename}</span>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <CodeSurface
          theme={theme}
          lang={lang}
          code={code}
          activeRole={activeRole}
          onPickRole={onPickRole}
          lineNumbers="relative"
          cursorLine={CURSOR_LINE}
          sign={sign}
          gutterWidth="2.75rem"
          annotations={{
            18: { text: "Undefined global `oklch`", color: c.error },
            21: { text: "unused variable `palette`", color: c.warning },
          }}
          searchTerm="oklch"
          className="h-full flex-1"
          overlay={<CompletionPopup theme={theme} onPick={onPickRole} />}
        />
      </div>

      {/* statusline */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        active={activeRole === "bgAlt"}
        className="flex h-[26px] shrink-0 items-stretch border-t font-mono text-[10.5px]"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        <span
          className="flex items-center px-2.5 font-bold"
          style={{ background: c.accent, color: c.bg }}
        >
          NORMAL
        </span>
        <Arrow from={c.accent} to={c.selection} />
        <span className="flex items-center px-2.5" style={{ color: c.fg, background: c.selection }}>
          ⑂ main
        </span>
        <Arrow from={c.selection} to={c.bgAlt} />
        <span className="flex items-center px-2.5" style={{ color: c.fgDim }}>
          {filename}
        </span>
        <span className="flex items-center gap-2 px-2" style={{ color: c.error }}>
          ⊗ 1<span style={{ color: c.warning }}>⚠ 1</span>
          <span style={{ color: c.info }}>ℹ 3</span>
        </span>

        <span className="ml-auto flex items-stretch">
          <ArrowBack from={c.selection} to={c.bgAlt} />
          <span
            className="flex items-center px-2.5"
            style={{ background: c.selection, color: c.fg }}
          >
            {lang}
          </span>
          <ArrowBack from={c.accent} to={c.selection} />
          <span
            className="flex items-center px-2.5 font-bold"
            style={{ background: c.accent, color: c.bg }}
          >
            {CURSOR_LINE}:12
          </span>
        </span>
      </Hit>
    </WindowFrame>
  );
}

/** nvim-cmp / Pmenu — a float is the fastest way to judge `bgAlt` and `selection`. */
function CompletionPopup({
  theme,
  onPick,
}: {
  theme: Theme;
  onPick?: (role: RoleId) => void;
}) {
  const c = theme.colors;
  const items = [
    { label: "oklchToHex", kind: "Function", role: "function" as const, active: true },
    { label: "oklchToRgb", kind: "Function", role: "function" as const },
    { label: "OKLCH", kind: "Interface", role: "type" as const },
    { label: "oklch", kind: "Variable", role: "variable" as const },
  ];

  return (
    <div
      className="pointer-events-auto absolute top-[190px] left-[13rem] hidden w-64 overflow-hidden rounded-md border shadow-xl md:block"
      style={{ background: c.bgAlt, borderColor: c.border }}
      onClick={() => onPick?.("bgAlt")}
      title="Pmenu / NormalFloat"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 px-2 py-[3px] text-[11px]"
          style={{
            background: item.active ? c.selection : "transparent",
            color: c[item.role],
          }}
        >
          <span className="flex-1 truncate">{item.label}</span>
          <span style={{ color: c.type }}>{item.kind}</span>
        </div>
      ))}
      <div
        className="border-t px-2 py-1 text-[10px] italic"
        style={{ borderColor: c.border, color: c.comment }}
      >
        Convert OKLCh to a hex string
      </div>
    </div>
  );
}

