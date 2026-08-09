import { ImageResponse } from "next/og";

/**
 * iOS won't accept an SVG for apple-touch-icon — Next's icon conventions list
 * only .jpg/.jpeg/.png for `apple-icon` — so without this file no
 * <link rel="apple-touch-icon"> is emitted at all and an iOS home-screen save
 * gets a screenshot instead of the mark.
 *
 * Same gradient as app/icon.svg, held on its first frame, so it stays one mark
 * rather than a hand-exported binary that silently diverges. Full bleed and
 * square: iOS applies its own corner mask.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundImage: "linear-gradient(135deg, #9fbdfe 0%, #f39be0 100%)",
        }}
      />
    ),
    { ...size },
  );
}
