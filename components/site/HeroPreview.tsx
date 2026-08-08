"use client";

import { useEffect, useState } from "react";
import { CodeSurface } from "@/components/preview/CodeSurface";
import { EditorChrome } from "@/components/preview/EditorChrome";
import { SAMPLES } from "@/lib/highlight/samples";
import { LANGUAGES, type LangId } from "@/lib/highlight/tokenize";
import { PRESETS } from "@/lib/theme/presets";

/**
 * The landing page's whole argument in one component: the same code, recolored
 * every few seconds, with the site's accent following along.
 */
export function HeroPreview() {
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<LangId>("tsx");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PRESETS.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const theme = PRESETS[index];

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.colors.accent);
  }, [theme]);

  return (
    <div
      className="flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-[420px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] transition-[box-shadow] sm:h-[460px]">
        <EditorChrome
          theme={theme}
          filename={LANGUAGES.find((l) => l.id === lang)?.filename ?? ""}
          tabs={LANGUAGES.slice(0, 4).map((l) => ({ id: l.id, label: l.label }))}
          activeTab={lang}
          onTabChange={(id) => setLang(id as LangId)}
        >
          <CodeSurface
            theme={theme}
            lang={lang}
            code={SAMPLES[lang]}
            cursorLine={9}
            className="h-full"
          />
        </EditorChrome>
      </div>

      <div className="flex items-center gap-2 px-1">
        <span className="label">{theme.name}</span>
        <div className="ml-auto flex gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setIndex(i)}
              aria-label={`Preview ${p.name}`}
              className="size-2.5 rounded-full border transition-transform hover:scale-125"
              style={{
                background: p.colors.accent,
                borderColor: i === index ? "var(--color-ink)" : "transparent",
                opacity: i === index ? 1 : 0.45,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
