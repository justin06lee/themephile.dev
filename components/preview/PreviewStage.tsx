"use client";

import Link from "next/link";
import { LANGUAGES, type LangId } from "@/lib/highlight/tokenize";
import { SAMPLES } from "@/lib/highlight/samples";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";
import { EmacsChrome } from "./chrome/EmacsChrome";
import { NeovimChrome } from "./chrome/NeovimChrome";
import { TerminalChrome } from "./chrome/TerminalChrome";
import { VimChrome } from "./chrome/VimChrome";
import { VsCodeChrome } from "./chrome/VsCodeChrome";
import type { ChromeProps } from "./chrome/types";

export type PreviewTargetId = "vscode" | "neovim" | "vim" | "emacs" | "terminal";

type PreviewTarget = {
  id: PreviewTargetId;
  label: string;
  /** Which export target this preview corresponds to. */
  exportId: string;
  chrome: (props: ChromeProps) => React.ReactElement;
  /** Terminals don't open source files. */
  showsCode: boolean;
};

export const PREVIEW_TARGETS: PreviewTarget[] = [
  { id: "vscode", label: "VS Code", exportId: "vscode", chrome: VsCodeChrome, showsCode: true },
  { id: "neovim", label: "Neovim", exportId: "neovim", chrome: NeovimChrome, showsCode: true },
  { id: "vim", label: "Vim", exportId: "vim", chrome: VimChrome, showsCode: true },
  { id: "emacs", label: "Emacs", exportId: "emacs", chrome: EmacsChrome, showsCode: true },
  {
    id: "terminal",
    label: "Terminal",
    exportId: "alacritty",
    chrome: TerminalChrome,
    showsCode: false,
  },
];

export const targetById = (id: PreviewTargetId) =>
  PREVIEW_TARGETS.find((t) => t.id === id) ?? PREVIEW_TARGETS[0];

export function PreviewStage({
  theme,
  target,
  onTargetChange,
  lang,
  onLangChange,
  activeRole,
  onPickRole,
}: {
  theme: Theme;
  target: PreviewTargetId;
  onTargetChange: (id: PreviewTargetId) => void;
  lang: LangId;
  onLangChange: (id: LangId) => void;
  activeRole?: RoleId | null;
  onPickRole?: (role: RoleId) => void;
}) {
  const current = targetById(target);
  const Chrome = current.chrome;
  const filename = LANGUAGES.find((l) => l.id === lang)?.filename ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
        {/* what program am I looking at */}
        <div className="flex gap-0.5 rounded-lg border border-line bg-sunken p-0.5">
          {PREVIEW_TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTargetChange(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                t.id === target
                  ? "bg-raised text-ink"
                  : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {t.label}
            </button>
          ))}
          <Link
            href="/tmux"
            className="rounded-md px-2.5 py-1 text-xs text-ink-faint transition-colors hover:text-ink-dim"
            title="tmux has its own studio"
          >
            tmux ↗
          </Link>
        </div>

        {/* what am I looking at it with */}
        {current.showsCode ? (
          <div className="flex flex-wrap gap-0.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => onLangChange(l.id)}
                className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                  l.id === lang
                    ? "bg-raised text-ink"
                    : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] text-ink-faint">
            Click any swatch below to edit that ANSI slot
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <Chrome
          theme={theme}
          lang={lang}
          code={SAMPLES[lang]}
          filename={filename}
          activeRole={activeRole}
          onPickRole={onPickRole}
        />
      </div>
    </div>
  );
}
