import { CodeSurface } from "@/components/preview/CodeSurface";
import type { GalleryTheme } from "@/lib/gallery/theme";
import { toEditorTheme } from "@/lib/gallery/theme";
import { SAMPLES } from "@/lib/highlight/samples";
import { contrastRatio } from "@/lib/color";
import {
  ANSI_ORDER,
  GROUP_LABELS,
  GROUP_ORDER,
  rolesInGroup,
} from "@/lib/theme/roles";

/**
 * The theme, at full size, rendered on the server.
 *
 * Every hex code is real text in the HTML rather than a swatch alone — someone
 * searching for a specific colour should be able to find the theme that uses
 * it, and a screen reader should be able to read the palette out.
 */
export function ThemeShowcase({ theme }: { theme: GalleryTheme }) {
  const editor = toEditorTheme(theme);
  const c = theme.colors;

  return (
    <div className="flex flex-col gap-8">
      <div
        className="overflow-hidden rounded-xl border shadow-2xl"
        style={{ borderColor: c.border, background: c.bg }}
      >
        <div
          className="flex items-center gap-2 border-b px-3 py-2 font-mono text-[11px]"
          style={{ background: c.bgAlt, borderColor: c.border, color: c.fgDim }}
        >
          <span className="flex gap-1.5">
            {[c.error, c.warning, c.success].map((dot) => (
              <span key={dot} className="size-2.5 rounded-full" style={{ background: dot }} />
            ))}
          </span>
          <span className="ml-1.5">use-theme.tsx</span>
          <span className="ml-auto" style={{ color: c.accent }}>
            {theme.name}
          </span>
        </div>
        <CodeSurface theme={editor} lang="tsx" code={SAMPLES.tsx} maxLines={24} cursorLine={9} />
      </div>

      <section>
        <h2 className="label pb-2.5">Terminal palette</h2>
        <ol className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {ANSI_ORDER.map((role, i) => (
            <li key={role} className="flex flex-col gap-1">
              <span
                className="h-9 rounded-md border border-line"
                style={{ background: c[role] }}
              />
              <span className="font-mono text-[9.5px] text-ink-faint">
                {i} {c[role].slice(1)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {GROUP_ORDER.filter((g) => g !== "ansi").map((group) => (
        <section key={group}>
          <h2 className="label pb-2.5">{GROUP_LABELS[group]}</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {rolesInGroup(group).map((role) => {
              const hex = c[role.id as keyof typeof c];
              const ratio = contrastRatio(hex, c.bg);
              return (
                <div key={role.id} className="flex items-center gap-2 py-0.5">
                  <span
                    className="size-4 shrink-0 rounded border border-line"
                    style={{ background: hex }}
                  />
                  <dt className="min-w-0 flex-1 truncate text-[12px] text-ink-dim">
                    {role.label}
                  </dt>
                  <dd
                    className="shrink-0 font-mono text-[10.5px] text-ink-faint"
                    title={`Contrast against the background: ${ratio.toFixed(2)}:1`}
                  >
                    {hex.slice(1)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
