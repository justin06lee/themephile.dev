"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CodeSurface } from "@/components/preview/CodeSurface";
import { SAMPLES } from "@/lib/highlight/samples";
import { detectFormat, importTheme, PARSERS } from "@/lib/import";
import { ANSI_ORDER, ROLE_BY_ID, ROLE_IDS, type RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

/** Roles worth showing as a strip — the ones that define a theme's character. */
const SIGNATURE: RoleId[] = [
  "bg",
  "fg",
  "accent",
  "comment",
  "keyword",
  "string",
  "function",
  "type",
  "number",
];

const ACCEPT =
  ".json,.jsonc,.lua,.vim,.el,.toml,.conf,.yaml,.yml,.itermcolors,.txt,.xresources,.xdefaults,text/*";

const MAX_FILE = 2_000_000;

type Mode = "paste" | "upload";

export function ImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (theme: Theme) => void;
}) {
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Parsing is cheap, but a dropped 300 KB colorscheme shouldn't make the
  // textarea stutter, so the read always trails the keystroke.
  const deferred = useDeferredValue(text);
  const outcome = useMemo(
    () => (deferred.trim() ? importTheme(deferred, filename) : null),
    [deferred, filename],
  );
  const sniffed = useMemo(
    () => (deferred.trim() ? detectFormat(deferred, filename) : null),
    [deferred, filename],
  );

  const readFile = useCallback(async (file: File) => {
    setFileError(null);
    if (file.size > MAX_FILE) {
      setFileError(
        `${file.name} is ${(file.size / 1_000_000).toFixed(1)} MB. Theme files are a few kilobytes — that's probably not one.`,
      );
      return;
    }
    setFilename(file.name);
    setText(await file.text());
    // Show what actually came out of the file: it's editable from here, and
    // seeing the contents is how you tell a theme from a settings dump.
    setMode("paste");
  }, []);

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

  const accept = () => {
    if (outcome?.ok) {
      onImport(outcome.theme);
      onClose();
    }
  };

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
        aria-label="Import a theme"
        className={`panel flex h-full max-h-[860px] w-full max-w-6xl flex-col overflow-hidden shadow-2xl transition-colors ${
          dragging ? "border-[var(--accent)]" : ""
        }`}
        // Dropping works anywhere in the dialog, not just on the drop zone —
        // people aim at the window, not at the dashed rectangle.
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void readFile(file);
        }}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">Import a theme</h2>
            <p className="label mt-1">
              Paste it or drop the file — it&rsquo;s read in this tab, never uploaded
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost ml-auto shrink-0 px-2"
            aria-label="Close import dialog"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* ── input ── */}
          <div className="flex min-h-0 flex-1 flex-col border-b border-line md:border-r md:border-b-0">
            <div className="flex shrink-0 items-center gap-1 px-3 py-2">
              {(["paste", "upload"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                    mode === m
                      ? "bg-raised text-ink"
                      : "text-ink-dim hover:bg-raised/60 hover:text-ink"
                  }`}
                >
                  {m === "paste" ? "Paste it" : "Upload a file"}
                </button>
              ))}

              {filename && (
                <span className="ml-auto flex min-w-0 items-center gap-1.5 rounded-md bg-sunken px-2 py-1 font-mono text-[10.5px] text-ink-dim">
                  <span className="truncate">{filename}</span>
                  <button
                    onClick={() => {
                      setFilename("");
                      setText("");
                      setFileError(null);
                    }}
                    aria-label="Clear file"
                    className="shrink-0 text-ink-faint transition-colors hover:text-ink"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            {mode === "paste" ? (
              <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (!e.target.value.trim()) setFilename("");
                  }}
                  spellCheck={false}
                  autoFocus
                  aria-label="Theme file contents"
                  placeholder={PLACEHOLDER}
                  className="min-h-0 flex-1 resize-none rounded-lg border border-line bg-sunken p-3 font-mono text-[11.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--accent)]"
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                <button
                  onClick={() => fileInput.current?.click()}
                  className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${
                    dragging
                      ? "border-[var(--accent)] bg-raised"
                      : "border-line hover:border-ink-faint hover:bg-sunken"
                  }`}
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-8 text-ink-faint"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <span className="text-sm text-ink">
                    Drop a theme file, or click to pick one
                  </span>
                  <span className="max-w-sm text-xs leading-relaxed text-ink-faint">
                    {".itermcolors"}, {".el"}, {".vim"}, {".lua"}, {".toml"},{" "}
                    {".conf"}, {".yaml"}, {".json"} — or anything else with colors
                    in it. Nothing leaves this tab.
                  </span>
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void readFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>

          {/* ── result ── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:max-w-[26rem]">
            {fileError ? (
              <Problem title="That file won't fit" hint={fileError} />
            ) : !outcome ? (
              <Waiting />
            ) : outcome.ok ? (
              <Result outcome={outcome} />
            ) : (
              <Problem
                title={outcome.error}
                hint={outcome.hint}
                sniffed={sniffed?.label}
              />
            )}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          <p className="text-xs text-ink-dim">
            {outcome?.ok ? (
              <>
                Read as <strong className="font-medium text-ink">{outcome.report.formatLabel}</strong>
                . Importing replaces the theme you&rsquo;re editing — ⌘Z brings it back.
              </>
            ) : (
              "Every format we export, plus base16, iTerm2, Xresources, and Windows Terminal."
            )}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn text-xs" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary text-xs"
              onClick={accept}
              disabled={!outcome?.ok}
              style={!outcome?.ok ? { opacity: 0.45, cursor: "default" } : undefined}
            >
              Use this theme
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const PLACEHOLDER = `Paste the whole file — no need to trim it.

A VS Code theme JSON, an init.lua colorscheme, a .vimrc
hi block, an Emacs deftheme, an Alacritty TOML, a kitty
conf, a base16 YAML… or just a list of hex codes.`;

function Waiting() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <h3 className="label">What it reads</h3>
      <ul className="flex flex-col gap-2">
        {PARSERS.filter((p) => p.id !== "hex-list").map((p) => (
          <li key={p.id} className="flex gap-2.5 text-xs leading-relaxed">
            <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-line" />
            <span>
              <strong className="font-medium text-ink">{p.label}</strong>
              <span className="text-ink-faint"> — {p.blurb}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-xs leading-relaxed text-ink-faint">
        Anything else with hex codes in it still works — they get sorted by
        lightness and hue into the closest roles.
      </p>
    </div>
  );
}

function Problem({
  title,
  hint,
  sniffed,
}: {
  title: string;
  hint: string;
  sniffed?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-2 p-4">
      <h3 className="text-sm font-medium text-amber-300">{title}</h3>
      <p className="text-xs leading-relaxed text-ink-dim">{hint}</p>
      {sniffed && (
        <p className="text-xs leading-relaxed text-ink-faint">
          It looked like a {sniffed} file, but nothing readable came out of it.
        </p>
      )}
    </div>
  );
}

function Result({ outcome }: { outcome: Extract<ReturnType<typeof importTheme>, { ok: true }> }) {
  const { theme, report } = outcome;
  const share = Math.round((report.matched.length / ROLE_IDS.length) * 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-sm font-medium">{theme.name}</h3>
          <span className="label shrink-0">{theme.appearance}</span>
        </div>

        <div className="mt-2.5 flex h-1 overflow-hidden rounded-full bg-sunken">
          <span
            className="bg-[var(--accent)]"
            style={{ width: `${share}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">
          {report.matched.length} of {ROLE_IDS.length} roles read from the file
          {report.derived.length > 0 && `, ${report.derived.length} derived`}
        </p>
      </div>

      {/* signature colors */}
      <div className="flex flex-wrap gap-1.5">
        {SIGNATURE.map((role) => (
          <span
            key={role}
            title={`${ROLE_BY_ID[role].label} — ${theme.colors[role]}${
              report.derived.includes(role) ? " (derived)" : ""
            }`}
            className="size-6 rounded-md border border-line"
            style={{
              background: theme.colors[role],
              // A dotted outline marks the ones we invented, so nothing is
              // presented as having come from the file when it didn't.
              outline: report.derived.includes(role)
                ? "1px dashed var(--color-ink-faint)"
                : undefined,
              outlineOffset: "1px",
            }}
          />
        ))}
      </div>

      {report.derived.some((r) => SIGNATURE.includes(r)) && (
        <p className="-mt-2 text-[11px] text-ink-faint">
          Dashed outline: derived rather than read from the file.
        </p>
      )}

      <div className="flex gap-[3px]">
        {ANSI_ORDER.map((role) => (
          <span
            key={role}
            title={`${ROLE_BY_ID[role].label} — ${theme.colors[role]}`}
            className="h-4 flex-1 rounded-[3px]"
            style={{ background: theme.colors[role] }}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <CodeSurface
          theme={theme}
          lang="tsx"
          code={SAMPLES.tsx}
          maxLines={12}
          fontSize={11}
          lineNumbers="none"
          gutterWidth="0.75rem"
        />
      </div>

      {report.notes.map((note, i) => (
        <p key={i} className="text-xs leading-relaxed text-ink-dim">
          {note}
        </p>
      ))}

      {report.derived.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-ink-faint transition-colors hover:text-ink">
            Which {report.derived.length} were derived
          </summary>
          <p className="mt-2 leading-relaxed text-ink-faint">
            {report.derived.map((r) => ROLE_BY_ID[r].label).join(", ")}.
          </p>
        </details>
      )}
    </div>
  );
}
