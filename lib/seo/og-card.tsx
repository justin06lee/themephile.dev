import { ImageResponse } from "next/og";
import { SAMPLES } from "@/lib/highlight/samples";
import { tokenizeLines } from "@/lib/highlight/tokenize";
import { PRESETS } from "@/lib/theme/presets";

/**
 * The shared social card.
 *
 * It is the product, not a picture of it: the real Nocturne palette from
 * lib/theme, applied to the real tokenizer's output over the real sample file.
 * So it cannot drift from the product without the build changing with it.
 *
 * Generated at build time and never fetched. next/og's bundled Geist covers
 * every glyph used here (`—` and `·` are in its cmap), so nothing triggers the
 * remote font or emoji resolution and the build works offline. Adding an emoji
 * or a box-drawing character would break that — check the glyph first.
 *
 * Each route renders its own copy because a page that sets `openGraph` in
 * metadata replaces the layout's object, taking the inherited image with it.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** First line of the excerpt, 1-based — the gutter numbers must match. */
const FIRST_LINE = 17;
const LINE_COUNT = 9;

export function ogCard(headline: string, footer: string) {
  const theme = PRESETS[0]; // Nocturne — the default, and the site's identity hue
  const c = theme.colors;
  const lines = tokenizeLines(SAMPLES.tsx, "tsx").slice(
    FIRST_LINE - 1,
    FIRST_LINE - 1 + LINE_COUNT,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#06070a",
          padding: 56,
          color: "#e9ebf1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 17,
              display: "flex",
              // The first frame of app/icon.svg's hue cycle, held still.
              backgroundImage: "linear-gradient(135deg, #9fbdfe 0%, #f39be0 100%)",
            }}
          />
          <div
            style={{ display: "flex", fontSize: 38, marginLeft: 18, letterSpacing: -1 }}
          >
            themephile
          </div>
          <div
            style={{ display: "flex", marginLeft: "auto", fontSize: 19, color: "#5f6779" }}
          >
            themephile.dev
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 46,
            lineHeight: 1.15,
            letterSpacing: -1.4,
            maxWidth: 900,
          }}
        >
          {headline}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            marginTop: 26,
            borderRadius: 14,
            border: `1px solid ${c.border}`,
            background: c.bg,
            padding: "16px 20px",
            fontSize: 20,
            lineHeight: 1.5,
            overflow: "hidden",
          }}
        >
          {lines.map((tokens, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre", flexShrink: 0 }}>
              <span style={{ display: "flex", width: 46, color: c.lineNumber }}>
                {String(FIRST_LINE + i)}
              </span>
              {tokens.map((token, j) => (
                <span key={j} style={{ color: c[token.role] }}>
                  {token.text}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 22,
            fontSize: 19,
            color: "#98a0b0",
          }}
        >
          <div style={{ display: "flex" }}>{footer}</div>
          <div style={{ display: "flex", marginLeft: "auto" }}>
            {PRESETS.map((p) => (
              <div
                key={p.name}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  marginLeft: 8,
                  background: p.colors.accent,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
