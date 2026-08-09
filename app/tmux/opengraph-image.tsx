import { contentType, ogCard, size } from "@/lib/seo/og-card";

export const alt =
  "themephile tmux studio: a TypeScript file syntax-highlighted in the Nocturne preset, over the accent colors of all eight built-in themes";
export { size, contentType };

export default function Image() {
  return ogCard(
    "Build a tmux status bar by looking at it.",
    "Segments · separators · pane borders — copy a complete .tmux.conf",
  );
}
