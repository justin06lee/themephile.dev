"use client";

import { useCallback, useEffect, useState } from "react";
import { readableOn } from "@/lib/color";
import type { LangId } from "@/lib/highlight/tokenize";
import {
  PreviewStage,
  targetById,
  type PreviewTargetId,
} from "@/components/preview/PreviewStage";
import { DEFAULT_THEME } from "@/lib/theme/presets";
import type { RoleId } from "@/lib/theme/roles";
import {
  decodeTheme,
  encodeTheme,
  loadTheme,
  saveTheme,
} from "@/lib/theme/serialize";
import { setColor, type Theme } from "@/lib/theme/theme";
import { ExportDialog } from "./ExportDialog";
import { Inspector } from "./Inspector";
import { RoleList } from "./RoleList";
import { Toolbar } from "./Toolbar";

const MAX_HISTORY = 60;

type EditorState = {
  theme: Theme;
  history: Theme[];
  /** Theme as it stood before the current drag — one undo step per gesture. */
  dragBase: Theme | null;
};

/**
 * Runs on mount only. This component is loaded with `ssr: false`, so the
 * browser APIs are available and there's no default-theme flash before the
 * saved one arrives.
 */
function restore(): EditorState {
  const hash = window.location.hash;
  const shared = hash.startsWith("#t=") ? decodeTheme(hash.slice(3)) : null;
  return {
    theme: shared ?? loadTheme() ?? DEFAULT_THEME,
    history: [],
    dragBase: null,
  };
}

export function EditorWorkspace() {
  const [{ theme, history }, setState] = useState<EditorState>(restore);
  const [role, setRole] = useState<RoleId>("keyword");
  const [lang, setLang] = useState<LangId>("tsx");
  const [target, setTarget] = useState<PreviewTargetId>("vscode");
  const [exportOpen, setExportOpen] = useState(false);

  // ── persist + keep the share link live ──
  useEffect(() => {
    const id = setTimeout(() => {
      saveTheme(theme);
      window.history.replaceState(null, "", `#t=${encodeTheme(theme)}`);
    }, 400);
    return () => clearTimeout(id);
  }, [theme]);

  // ── the site chrome borrows the accent you're designing with ──
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--accent-contrast", readableOn(theme.colors.accent));
  }, [theme.colors.accent]);

  const commit = useCallback((next: Theme) => {
    setState((s) => ({
      theme: next,
      history: [...s.history.slice(-MAX_HISTORY), s.theme],
      dragBase: null,
    }));
  }, []);

  const undo = useCallback(() => {
    setState((s) =>
      s.history.length === 0
        ? s
        : {
            theme: s.history[s.history.length - 1],
            history: s.history.slice(0, -1),
            dragBase: null,
          },
    );
  }, []);

  /** Live value while dragging the picker — deliberately not an undo step. */
  const previewColor = useCallback(
    (hex: string) => {
      setState((s) => ({
        ...s,
        dragBase: s.dragBase ?? s.theme,
        theme: setColor(s.theme, role, hex),
      }));
    },
    [role],
  );

  const commitColor = useCallback(
    (hex: string) => {
      setState((s) => {
        const base = s.dragBase ?? s.theme;
        return {
          theme: setColor(base, role, hex),
          history: [...s.history.slice(-MAX_HISTORY), base],
          dragBase: null,
        };
      });
    },
    [role],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Toolbar
        theme={theme}
        onCommit={commit}
        onUndo={undo}
        canUndo={history.length > 0}
        onExport={() => setExportOpen(true)}
      />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="h-64 shrink-0 border-b border-line lg:h-auto lg:w-[272px] lg:border-r lg:border-b-0">
          <RoleList theme={theme} selected={role} onSelect={setRole} />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col p-3">
          <PreviewStage
            theme={theme}
            target={target}
            onTargetChange={setTarget}
            lang={lang}
            onLangChange={setLang}
            activeRole={role}
            onPickRole={setRole}
          />
        </section>

        <aside className="shrink-0 border-t border-line lg:w-[312px] lg:border-t-0 lg:border-l">
          <Inspector
            theme={theme}
            role={role}
            onPreview={previewColor}
            onCommit={commitColor}
          />
        </aside>
      </main>

      {/* Keyed by target so opening Export lands on whatever you're previewing. */}
      <ExportDialog
        key={target}
        theme={theme}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        initialTarget={targetById(target).exportId}
      />
    </div>
  );
}
