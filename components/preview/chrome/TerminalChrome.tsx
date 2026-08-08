"use client";

import type { ReactNode } from "react";
import { readableOn } from "@/lib/color";
import { ANSI_ORDER } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";
import { Hit, WindowFrame } from "../Hit";
import type { ChromeProps } from "./types";

/** A span of terminal output in one ANSI color. */
function S({
  color,
  bold,
  children,
}: {
  color: string;
  bold?: boolean;
  children: ReactNode;
}) {
  return <span style={{ color, fontWeight: bold ? 700 : 400 }}>{children}</span>;
}

function Prompt({ theme }: { theme: Theme }) {
  const c = theme.colors;
  return (
    <>
      <S color={c.ansiGreen} bold>
        ➜
      </S>{" "}
      <S color={c.ansiCyan} bold>
        themephile
      </S>{" "}
      <S color={c.ansiBrightBlack}>git:(</S>
      <S color={c.ansiRed}>master</S>
      <S color={c.ansiBrightBlack}>)</S>{" "}
    </>
  );
}

/**
 * The terminal preview. The ANSI sixteen never show up in a code sample, and
 * they're what `ls`, `git`, and every TUI use all day — so they get a surface
 * where each one appears in the job it actually does.
 */
export function TerminalChrome({ theme, activeRole, onPickRole }: ChromeProps) {
  const c = theme.colors;

  return (
    <WindowFrame
      bg={c.bg}
      border={c.border}
      titleBg={c.bgAlt}
      titleFg={c.fgDim}
      title="zsh — 96×28"
      dots={[c.error, c.warning, c.success]}
      onPick={onPickRole}
      activeRole={activeRole}
    >
      {/* tab bar — kitty and WezTerm both export these colors */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        className="flex shrink-0 items-stretch font-mono text-[10.5px]"
        style={{ background: c.bgAlt }}
        title="tab bar"
      >
        <span className="px-3 py-1.5 font-semibold" style={{ background: c.bg, color: c.fg }}>
          1: zsh
        </span>
        <span className="px-3 py-1.5" style={{ color: c.fgDim }}>
          2: nvim
        </span>
        <span className="px-3 py-1.5" style={{ color: c.fgDim }}>
          3: server
        </span>
        <span className="ml-auto px-3 py-1.5" style={{ color: c.accent }}>
          +
        </span>
      </Hit>

      <div
        className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11.5px] leading-[1.7] whitespace-pre"
        style={{ background: c.bg, color: c.fg }}
      >
        {/* ls --color */}
        <div>
          <Prompt theme={theme} />
          <S color={c.fg}>ls --color</S>
        </div>
        <div className="grid max-w-2xl grid-cols-2 sm:grid-cols-4">
          <S color={c.ansiBlue} bold>
            components/
          </S>
          <S color={c.ansiBlue} bold>
            lib/
          </S>
          <S color={c.ansiCyan}>node_modules →</S>
          <S color={c.ansiGreen} bold>
            build.sh
          </S>
          <S color={c.fg}>README.md</S>
          <S color={c.ansiMagenta}>logo.svg</S>
          <S color={c.ansiRed}>theme.tar.gz</S>
          <S color={c.fg}>bun.lock</S>
        </div>

        {/* git */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>git status -sb</S>
        </div>
        <div>
          <S color={c.ansiBrightBlack}>## </S>
          <S color={c.ansiGreen}>master</S>
          <S color={c.ansiBrightBlack}>...origin/master</S>
        </div>
        <div>
          <S color={c.ansiGreen}>A </S>
          <S color={c.fg}> components/preview/chrome/TerminalChrome.tsx</S>
        </div>
        <div>
          <S color={c.ansiRed}> D</S>
          <S color={c.fg}> components/preview/TerminalMock.tsx</S>
        </div>
        <div>
          <S color={c.ansiYellow}> M</S>
          <S color={c.fg}> components/preview/CodeSurface.tsx</S>
        </div>

        {/* search match + selection */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>rg &quot;oklch&quot; lib/</S>
        </div>
        <div>
          <S color={c.ansiMagenta}>lib/color.ts</S>
          <S color={c.ansiBrightBlack}>:</S>
          <S color={c.ansiGreen}>142</S>
          <S color={c.ansiBrightBlack}>:</S>
          <S color={c.fg}>export function </S>
          <span style={{ background: c.matchBg, color: c.fg }} title="search match — matchBg">
            oklch
          </span>
          <S color={c.fg}>ToHex(</S>
        </div>
        <div>
          <S color={c.ansiMagenta}>lib/theme/theme.ts</S>
          <S color={c.ansiBrightBlack}>:</S>
          <S color={c.ansiGreen}>88</S>
          <S color={c.ansiBrightBlack}>:</S>
          <span style={{ background: c.selection, color: c.fg }} title="selection">
            {"  const accent = ink({ slot: 0 })"}
          </span>
        </div>

        {/* a diff, where the diagnostic colors do their other job */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>git diff --stat</S>
        </div>
        <div>
          <S color={c.fg}> lib/export/kitty.ts | 18 </S>
          <S color={c.ansiGreen}>++++++++++++</S>
          <S color={c.ansiRed}>------</S>
        </div>
        <div>
          <S color={c.ansiBrightBlack}> 1 file changed, 12 insertions(+), 6 deletions(-)</S>
        </div>

        {/* a TUI bar, where the bright colors earn their keep */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>btop</S>
        </div>
        <div>
          <S color={c.ansiBrightBlack}>cpu </S>
          <S color={c.ansiGreen}>▁▂▃</S>
          <S color={c.ansiBrightGreen}>▄▅</S>
          <S color={c.ansiYellow}>▆▆</S>
          <S color={c.ansiBrightYellow}>▇</S>
          <S color={c.ansiRed}>█</S>
          <S color={c.ansiBrightRed}>█</S>
          <S color={c.ansiBrightBlack}> 74%</S>
          <S color={c.ansiBrightBlack}>{"   mem "}</S>
          <S color={c.ansiCyan}>████████</S>
          <S color={c.ansiBrightBlack}>░░░░ 62%</S>
        </div>

        {/* test output — pass/fail is the most-read color pair in a terminal */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>bun test</S>
        </div>
        <div>
          <S color={c.ansiBrightGreen}>✓</S>
          <S color={c.fg}> color › oklch round trip </S>
          <S color={c.ansiBrightBlack}>3ms</S>
        </div>
        <div>
          <S color={c.ansiBrightGreen}>✓</S>
          <S color={c.fg}> color › contrast matches WCAG </S>
          <S color={c.ansiBrightBlack}>1ms</S>
        </div>
        <div>
          <S color={c.ansiBrightRed}>✗</S>
          <S color={c.fg}> tmux › escapes powerline glyphs </S>
          <S color={c.ansiBrightBlack}>12ms</S>
        </div>
        <div>
          <S color={c.ansiGreen} bold>
            2 pass
          </S>
          <S color={c.ansiBrightBlack}> · </S>
          <S color={c.ansiRed} bold>
            1 fail
          </S>
          <S color={c.ansiBrightBlack}> · ran 3 tests</S>
        </div>

        {/* normal against bright, side by side — the only honest way to judge 8–15 */}
        <div className="mt-2">
          <Prompt theme={theme} />
          <S color={c.fg}>
            printf &apos;\e[3%dm%s\e[0m&apos;
          </S>
        </div>
        <div>
          <S color={c.ansiBrightBlack}>normal </S>
          {(["ansiBlack", "ansiRed", "ansiGreen", "ansiYellow", "ansiBlue", "ansiMagenta", "ansiCyan", "ansiWhite"] as const).map(
            (id) => (
              <S key={id} color={c[id]}>
                ███
              </S>
            ),
          )}
        </div>
        <div>
          <S color={c.ansiBrightBlack}>bright </S>
          {(["ansiBrightBlack", "ansiBrightRed", "ansiBrightGreen", "ansiBrightYellow", "ansiBrightBlue", "ansiBrightMagenta", "ansiBrightCyan", "ansiBrightWhite"] as const).map(
            (id) => (
              <S key={id} color={c[id]}>
                ███
              </S>
            ),
          )}
        </div>

        <div className="mt-2">
          <Prompt theme={theme} />
          <span
            className="inline-block w-[7px] translate-y-[2px]"
            style={{ background: c.cursor, height: "1em" }}
            title="cursor"
          />
        </div>
      </div>

      {/* the palette itself — click a swatch, edit that ANSI slot */}
      <div className="shrink-0 border-t" style={{ borderColor: c.border }}>
        <div className="grid grid-cols-8">
          {ANSI_ORDER.map((id, i) => {
            const hex = c[id];
            const active = activeRole === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPickRole?.(id)}
                title={`${id} · ${hex}`}
                className="flex h-8 items-center justify-center font-mono text-[9px] transition-transform hover:z-10 hover:scale-105"
                style={{
                  background: hex,
                  color: readableOn(hex),
                  outline: active ? `2px solid ${c.fg}` : undefined,
                  outlineOffset: "-2px",
                  cursor: onPickRole ? "pointer" : "default",
                }}
              >
                {i}
              </button>
            );
          })}
        </div>
        <div
          className="flex items-center justify-between px-3 py-1.5 font-mono text-[9.5px]"
          style={{ background: c.bgAlt, color: c.fgDim }}
        >
          <span>0–7 normal</span>
          <span>8–15 bright</span>
        </div>
      </div>
    </WindowFrame>
  );
}
