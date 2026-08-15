import { tokenizeLines } from "@/lib/highlight/tokenize";
import type { ColorMap } from "@/lib/theme/roles";

/**
 * A card preview, rendered on the server with no client JavaScript.
 *
 * Cards are static content, so the tokenizer runs at render time and the
 * result ships as plain spans. That keeps a grid of two dozen themes free of
 * hydration cost, and it puts real code text in the HTML where a crawler can
 * read it.
 */

/** Short on purpose: every line has to earn its place by showing a new role. */
const SNIPPET = `export const useTheme = (hue: number) => {
  // perceptual: 10% lighter reads the same on every hue
  const [scheme, setScheme] = useState("spectrum");
  const swatches = spread(hue, 8).map((h, i) => ({
    hex: oklch({ l: 0.79, c: 0.13, h }),
    label: \`slot-\${i}\`,
  }));
  return { scheme, setScheme, swatches };
};`;

const LINES = tokenizeLines(SNIPPET, "tsx");

export function MiniPreview({
  colors,
  rows = 8,
  fontSize = 10.5,
}: {
  colors: ColorMap;
  rows?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden font-mono leading-[1.55]"
      style={{ background: colors.bg, fontSize }}
      aria-hidden
    >
      {LINES.slice(0, rows).map((tokens, i) => (
        <div key={i} className="flex whitespace-pre">
          <span
            className="w-6 shrink-0 pr-2 text-right tabular-nums"
            style={{ color: colors.lineNumber }}
          >
            {i + 1}
          </span>
          <span className="min-w-0 truncate">
            {tokens.map((token, j) => (
              <span key={j} style={{ color: colors[token.role] }}>
                {token.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The 16 ANSI slots as a single strip — the fastest read of a palette. */
export function AnsiStrip({
  colors,
  order,
  className = "",
}: {
  colors: ColorMap;
  order: readonly string[];
  className?: string;
}) {
  return (
    <div className={`flex h-1.5 w-full ${className}`} aria-hidden>
      {order.map((role) => (
        <span
          key={role}
          className="flex-1"
          style={{ background: colors[role as keyof ColorMap] }}
        />
      ))}
    </div>
  );
}
