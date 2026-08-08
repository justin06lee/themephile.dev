"use client";

import { ANSI_ORDER, type RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

/**
 * A fake shell session. The ANSI sixteen are invisible in a code sample, and
 * they're exactly what tmux, git, and ls will use all day.
 */
export function TerminalMock({
  theme,
  onPickRole,
  activeRole,
  compact = false,
}: {
  theme: Theme;
  onPickRole?: (role: RoleId) => void;
  activeRole?: RoleId | null;
  compact?: boolean;
}) {
  const c = theme.colors;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border font-mono text-[11.5px] leading-[1.75]"
      style={{ background: c.bg, borderColor: c.border, color: c.fg }}
    >
      <div
        className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5 text-[10px]"
        style={{ background: c.bgAlt, borderColor: c.border, color: c.fgDim }}
      >
        <span style={{ color: c.accent }}>●</span> zsh — 92×24
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Line>
          <S c={c.ansiGreen}>➜</S> <S c={c.ansiCyan}>~/code/themephile</S>{" "}
          <S c={c.ansiBrightBlack}>git:(</S>
          <S c={c.ansiRed}>main</S>
          <S c={c.ansiBrightBlack}>)</S> <S c={c.ansiYellow}>✗</S>{" "}
          <S c={c.fg}>git status -sb</S>
        </Line>
        <Line>
          <S c={c.ansiBrightBlack}>##</S> <S c={c.ansiGreen}>main</S>
          <S c={c.ansiBrightBlack}>...origin/main</S>
        </Line>
        <Line>
          <S c={c.ansiGreen}>A </S> <S c={c.fg}>lib/export/neovim.ts</S>
        </Line>
        <Line>
          <S c={c.ansiRed}> D</S> <S c={c.fg}>lib/legacy/theme.js</S>
        </Line>
        <Line>
          <S c={c.ansiYellow}> M</S> <S c={c.fg}>app/editor/page.tsx</S>
        </Line>
        <Line>
          <S c={c.ansiBrightBlack}>?? </S>
          <S c={c.fg}>notes.md</S>
        </Line>

        {!compact && (
          <>
            <Line>&nbsp;</Line>
            <Line>
              <S c={c.ansiGreen}>➜</S> <S c={c.ansiCyan}>~/code/themephile</S>{" "}
              <S c={c.fg}>bun test</S>
            </Line>
            <Line>
              <S c={c.ansiBrightGreen}>✓</S> <S c={c.fg}>color.oklch round trip</S>{" "}
              <S c={c.ansiBrightBlack}>3ms</S>
            </Line>
            <Line>
              <S c={c.ansiBrightGreen}>✓</S> <S c={c.fg}>contrast ratio matches WCAG</S>{" "}
              <S c={c.ansiBrightBlack}>1ms</S>
            </Line>
            <Line>
              <S c={c.ansiBrightRed}>✗</S> <S c={c.fg}>tmux config escapes</S>{" "}
              <S c={c.ansiBrightBlack}>12ms</S>
            </Line>
            <Line>
              <S c={c.ansiBrightMagenta}>
                2 pass
              </S>{" "}
              <S c={c.ansiBrightBlack}>·</S> <S c={c.ansiBrightRed}>1 fail</S>
            </Line>
          </>
        )}

        <Line>
          <S c={c.ansiGreen}>➜</S> <S c={c.ansiCyan}>~/code/themephile</S>{" "}
          <span
            className="inline-block w-[7px] translate-y-[1px]"
            style={{ background: c.cursor, height: "1em" }}
          />
        </Line>
      </div>

      <div
        className="grid shrink-0 grid-cols-16 border-t"
        style={{ borderColor: c.border }}
      >
        {ANSI_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            title={id}
            onClick={onPickRole ? () => onPickRole(id) : undefined}
            className="h-5 transition-transform hover:scale-y-125"
            style={{
              background: c[id],
              outline: activeRole === id ? `2px solid ${c.fg}` : undefined,
              outlineOffset: "-2px",
              cursor: onPickRole ? "pointer" : "default",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const Line = ({ children }: { children: React.ReactNode }) => (
  <div className="whitespace-pre">{children}</div>
);

const S = ({ c, children }: { c: string; children: React.ReactNode }) => (
  <span style={{ color: c }}>{children}</span>
);
