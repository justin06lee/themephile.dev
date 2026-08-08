"use client";

import type { TmuxConfig } from "@/lib/tmux/config";
import type { Theme } from "@/lib/theme/theme";
import { TmuxStatusBar } from "./TmuxStatusBar";

const BORDER_STYLE: Record<TmuxConfig["paneBorderLines"], React.CSSProperties> = {
  single: { borderWidth: 1, borderStyle: "solid" },
  double: { borderWidth: 3, borderStyle: "double" },
  heavy: { borderWidth: 2, borderStyle: "solid" },
  simple: { borderWidth: 1, borderStyle: "dashed" },
  number: { borderWidth: 1, borderStyle: "solid" },
};

export function TmuxPreview({
  config,
  theme,
  className = "",
}: {
  config: TmuxConfig;
  theme: Theme;
  className?: string;
}) {
  const c = theme.colors;
  const bar = <TmuxStatusBar config={config} />;
  const border = BORDER_STYLE[config.paneBorderLines];

  const pane = (active: boolean, index: number, children: React.ReactNode) => (
    <div
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden p-2"
      style={{
        ...border,
        borderColor: active ? config.colors.paneActiveBorder : config.colors.paneBorder,
        background: c.bg,
      }}
    >
      {config.paneBorderLines === "number" && (
        <span
          className="absolute top-0.5 right-1 font-mono text-[9px]"
          style={{
            color: active ? config.colors.paneActiveBorder : config.colors.paneBorder,
          }}
        >
          {index}
        </span>
      )}
      {children}
    </div>
  );

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border ${className}`}
      style={{ borderColor: c.border, background: c.bg }}
    >
      <div
        className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5 font-mono text-[10px]"
        style={{ background: c.bgAlt, borderColor: c.border, color: c.fgDim }}
      >
        <span style={{ color: c.accent }}>●</span> tmux · attached
      </div>

      {config.statusPosition === "top" && bar}

      <div className="flex min-h-0 flex-1 gap-0 p-1 font-mono text-[11px] leading-relaxed">
        {pane(
          true,
          0,
          <div style={{ color: c.fg }}>
            <div>
              <span style={{ color: c.comment }}>{"-- theme.lua"}</span>
            </div>
            <div>
              <span style={{ color: c.storage }}>local</span>{" "}
              <span style={{ color: c.variable }}>palette</span>{" "}
              <span style={{ color: c.operator }}>=</span>{" "}
              <span style={{ color: c.punctuation }}>{"{"}</span>
            </div>
            <div>
              {"  "}
              <span style={{ color: c.property }}>bg</span>
              <span style={{ color: c.operator }}> = </span>
              <span style={{ color: c.string }}>&quot;{c.bg}&quot;</span>
              <span style={{ color: c.punctuation }}>,</span>
            </div>
            <div>
              {"  "}
              <span style={{ color: c.property }}>accent</span>
              <span style={{ color: c.operator }}> = </span>
              <span style={{ color: c.string }}>&quot;{c.accent}&quot;</span>
              <span style={{ color: c.punctuation }}>,</span>
            </div>
            <div>
              <span style={{ color: c.punctuation }}>{"}"}</span>
              <span
                className="ml-px inline-block w-[6px] align-middle"
                style={{ background: c.cursor, height: "1em" }}
              />
            </div>
          </div>,
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {pane(
            false,
            1,
            <div>
              <div style={{ color: c.ansiGreen }}>✓ ready in 412ms</div>
              <div style={{ color: c.ansiBrightBlack }}>
                ➜ local: <span style={{ color: c.ansiCyan }}>http://localhost:3000</span>
              </div>
              <div style={{ color: c.ansiYellow }}>⚠ 1 warning</div>
            </div>,
          )}
          {pane(
            false,
            2,
            <div>
              <div style={{ color: c.ansiBrightBlack }}>$ git log --oneline -3</div>
              <div>
                <span style={{ color: c.ansiYellow }}>b98e5b8</span>{" "}
                <span style={{ color: c.fg }}>feat: tmux studio</span>
              </div>
              <div>
                <span style={{ color: c.ansiYellow }}>2c4d1a0</span>{" "}
                <span style={{ color: c.fg }}>fix: contrast pass</span>
              </div>
            </div>,
          )}
        </div>
      </div>

      {config.statusPosition === "bottom" && bar}
    </div>
  );
}
