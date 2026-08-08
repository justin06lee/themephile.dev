"use client";

import { contrastGrade, contrastRatio } from "@/lib/color";
import { ROLE_BY_ID, type RoleId } from "@/lib/theme/roles";
import { deriveTheme, type Theme } from "@/lib/theme/theme";
import { ColorPicker } from "./ColorPicker";

type Props = {
  theme: Theme;
  role: RoleId;
  /** Live updates while dragging — cheap, not recorded in history. */
  onPreview: (hex: string) => void;
  /** Final value — recorded in history. */
  onCommit: (hex: string) => void;
};

export function Inspector({ theme, role, onPreview, onCommit }: Props) {
  const meta = ROLE_BY_ID[role];
  const hex = theme.colors[role];
  const generated = deriveTheme(theme.seed).colors[role];
  const isCustom = generated.toLowerCase() !== hex.toLowerCase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">{meta.label}</h2>
          <code className="font-mono text-[10px] text-ink-faint">{role}</code>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">{meta.hint}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <ColorPicker value={hex} onChange={onPreview} onCommit={onCommit} />

        <div className="mt-5">
          <h3 className="label pb-2">Contrast</h3>
          <div className="flex flex-col gap-1.5">
            <ContrastRow label="on background" fg={hex} bg={theme.colors.bg} />
            <ContrastRow label="on panel" fg={hex} bg={theme.colors.bgAlt} />
            {meta.surface && (
              <ContrastRow label="text on this" fg={theme.colors.fg} bg={hex} />
            )}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="label pb-2">In context</h3>
          <div
            className="rounded-lg border p-3 font-mono text-xs"
            style={{ background: theme.colors.bg, borderColor: theme.colors.border }}
          >
            <span style={{ color: theme.colors.fgDim }}>{"// "}</span>
            <span style={{ color: hex }}>
              {meta.group === "ansi" ? "▉▉▉▉ " : ""}
              the quick brown fox
            </span>
          </div>
        </div>

        {isCustom && (
          <button
            type="button"
            onClick={() => onCommit(generated)}
            className="btn mt-5 w-full justify-between text-xs"
          >
            <span className="text-ink-dim">Reset to generated</span>
            <span
              className="size-4 rounded border border-line"
              style={{ background: generated }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

function ContrastRow({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  const ratio = contrastRatio(fg, bg);
  const grade = contrastGrade(ratio);
  const tone =
    grade === "Fail"
      ? "text-red-400/90 border-red-400/25 bg-red-400/10"
      : grade === "AA Large"
        ? "text-amber-300/90 border-amber-300/25 bg-amber-300/10"
        : "text-emerald-300/90 border-emerald-300/25 bg-emerald-300/10";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="grid size-7 shrink-0 place-items-center rounded border border-line font-mono text-[10px]"
        style={{ background: bg, color: fg }}
      >
        Ag
      </span>
      <span className="flex-1 text-ink-dim">{label}</span>
      <span className="font-mono text-[11px] text-ink-dim">{ratio.toFixed(2)}</span>
      <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${tone}`}>
        {grade}
      </span>
    </div>
  );
}
