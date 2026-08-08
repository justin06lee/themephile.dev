"use client";

import { useEffect, useState } from "react";
import {
  PREVIEW_TARGETS,
  targetById,
  type PreviewTargetId,
} from "@/components/preview/PreviewStage";
import { SAMPLES } from "@/lib/highlight/samples";
import { LANGUAGES, type LangId } from "@/lib/highlight/tokenize";
import { PRESETS } from "@/lib/theme/presets";

/**
 * The landing page's whole argument in one component: the same code, recolored
 * every few seconds, and redrawn as a different program every few more.
 */
export function HeroPreview() {
  const [tick, setTick] = useState(0);
  const [lang, setLang] = useState<LangId>("tsx");
  const [pinned, setPinned] = useState<PreviewTargetId | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const theme = PRESETS[tick % PRESETS.length];
  // Palettes change every tick; the program changes half as often, so neither
  // transition gets lost in the other.
  const auto = PREVIEW_TARGETS[Math.floor(tick / 2) % PREVIEW_TARGETS.length].id;
  const target = targetById(pinned ?? auto);
  const Chrome = target.chrome;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.colors.accent);
  }, [theme]);

  return (
    <div
      className="flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-[440px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:h-[480px]">
        <Chrome
          theme={theme}
          lang={lang}
          code={SAMPLES[lang]}
          filename={LANGUAGES.find((l) => l.id === lang)?.filename ?? ""}
          onPickRole={undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <div className="flex gap-0.5">
          {PREVIEW_TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => setPinned(t.id)}
              className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                t.id === target.id
                  ? "bg-raised text-ink"
                  : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {target.showsCode && (
          <div className="hidden gap-0.5 sm:flex">
            {LANGUAGES.slice(0, 4).map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`rounded-md px-1.5 py-1 font-mono text-[10px] transition-colors ${
                  l.id === lang ? "text-ink" : "text-ink-faint hover:text-ink-dim"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        <span className="label ml-auto">{theme.name}</span>
        <div className="flex gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setTick(i)}
              aria-label={`Preview ${p.name}`}
              className="size-2.5 rounded-full border transition-transform hover:scale-125"
              style={{
                background: p.colors.accent,
                borderColor:
                  i === tick % PRESETS.length ? "var(--color-ink)" : "transparent",
                opacity: i === tick % PRESETS.length ? 1 : 0.45,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
