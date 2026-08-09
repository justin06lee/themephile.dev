"use client";

import { useEffect, useMemo, useState } from "react";
import { TARGET_FAMILIES, TARGETS } from "@/lib/export";
import { download } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import { ConfigPreview } from "./ConfigPreview";
import { CopyButton } from "./CopyButton";

export function ExportDialog({
  theme,
  open,
  onClose,
  initialTarget,
}: {
  theme: Theme;
  open: boolean;
  onClose: () => void;
  initialTarget?: string;
}) {
  const [targetId, setTargetId] = useState(initialTarget ?? TARGETS[0].id);
  const [fileIndex, setFileIndex] = useState(0);

  const target = TARGETS.find((t) => t.id === targetId) ?? TARGETS[0];
  const files = useMemo(() => target.files(theme), [target, theme]);
  const file = files[Math.min(fileIndex, files.length - 1)];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export theme"
        className="panel flex h-full max-h-[860px] w-full max-w-6xl flex-col overflow-hidden shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">
              Export <span className="text-ink-dim">·</span> {theme.name}
            </h2>
            <p className="label mt-1">No account, no upload — generated in your browser</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost ml-auto shrink-0 px-2"
            aria-label="Close export dialog"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* targets */}
          <nav className="shrink-0 overflow-x-auto border-b border-line p-2 md:w-48 md:overflow-y-auto md:border-r md:border-b-0">
            <div className="flex gap-1 md:flex-col">
              {TARGET_FAMILIES.map((family) => {
                const items = TARGETS.filter((t) => t.family === family.id);
                if (!items.length) return null;
                return (
                  <div key={family.id} className="contents md:block">
                    <h3 className="label hidden px-2 pt-3 pb-1.5 md:block">
                      {family.label}
                    </h3>
                    {items.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTargetId(t.id);
                          setFileIndex(0);
                        }}
                        className={`w-full rounded-md px-2.5 py-1.5 text-left text-[13px] whitespace-nowrap transition-colors ${
                          t.id === targetId
                            ? "bg-raised text-ink"
                            : "text-ink-dim hover:bg-raised/60 hover:text-ink"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* file */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
              {files.length > 1 ? (
                <div className="flex gap-1">
                  {files.map((f, i) => (
                    <button
                      key={f.filename}
                      onClick={() => setFileIndex(i)}
                      className={`rounded-md px-2 py-1 font-mono text-[11px] transition-colors ${
                        i === fileIndex
                          ? "bg-raised text-ink"
                          : "text-ink-faint hover:text-ink"
                      }`}
                    >
                      {f.filename}
                    </button>
                  ))}
                </div>
              ) : (
                <code className="font-mono text-[11px] text-ink-dim">
                  {file.filename}
                </code>
              )}

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="btn text-xs"
                  onClick={() => download(file.filename, file.contents)}
                >
                  Download
                </button>
                <CopyButton value={file.contents} label="Copy file" primary />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <ConfigPreview file={file} theme={theme} />
            </div>

            <div className="max-h-[38%] shrink-0 overflow-y-auto border-t border-line px-4 py-3">
              <p className="mb-2 text-xs leading-relaxed text-ink-dim">{target.blurb}</p>
              <h3 className="label pb-2">Where it goes</h3>
              <ol className="flex flex-col gap-1.5 text-xs leading-relaxed text-ink-dim">
                {target.install(theme).map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-px shrink-0 font-mono text-[10px] text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: mdish(step) }} />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Install steps are authored with backticks and **bold**. They're our own
 * strings, but escape first anyway so a theme name can never inject markup.
 */
function mdish(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-raised px-1 py-0.5 font-mono text-[10.5px] text-ink">$1</code>',
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-medium text-ink">$1</strong>');
}
