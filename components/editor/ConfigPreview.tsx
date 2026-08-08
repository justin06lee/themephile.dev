"use client";

import { useMemo } from "react";
import { readableOn } from "@/lib/color";
import type { ExportFile } from "@/lib/export";
import type { Theme } from "@/lib/theme/theme";

const COMMENT_MARKER: Record<ExportFile["language"], string | null> = {
  json: null,
  lua: "--",
  vim: '"',
  elisp: ";",
  toml: "#",
  conf: "#",
  ini: "#",
};

const HEX = /#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g;

/**
 * Renders generated config in the theme it describes, with every hex literal
 * painted in its own color — the fastest way to eyeball a palette.
 */
export function ConfigPreview({ file, theme }: { file: ExportFile; theme: Theme }) {
  const marker = COMMENT_MARKER[file.language];
  const lines = useMemo(() => file.contents.split("\n"), [file.contents]);

  return (
    <pre
      className="h-full overflow-auto p-4 font-mono text-[11.5px] leading-[1.7]"
      style={{ background: theme.colors.bg, color: theme.colors.fg }}
    >
      <code>
        {lines.map((line, i) => {
          const isComment = marker !== null && line.trimStart().startsWith(marker);
          if (isComment) {
            return (
              <div key={i} style={{ color: theme.colors.comment }}>
                {line || " "}
              </div>
            );
          }
          return (
            <div key={i}>{line ? paint(line, theme) : " "}</div>
          );
        })}
      </code>
    </pre>
  );
}

function paint(line: string, theme: Theme) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(HEX)) {
    const start = m.index ?? 0;
    if (start > last) out.push(line.slice(last, start));
    const hex = m[0];
    out.push(
      <span
        key={`${start}-${hex}`}
        className="rounded-[3px] px-[3px] py-px"
        style={{ background: hex.slice(0, 7), color: readableOn(hex.slice(0, 7)) }}
      >
        {hex}
      </span>,
    );
    last = start + hex.length;
  }
  if (last === 0) {
    // No colors on this line — tint section headers so structure still reads.
    if (/^\s*[[;]/.test(line)) {
      return <span style={{ color: theme.colors.keyword }}>{line}</span>;
    }
    return line;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
