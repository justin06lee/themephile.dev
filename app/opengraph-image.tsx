import { contentType, ogCard, size } from "@/lib/seo/og-card";

export const alt =
  "themephile: a TypeScript file syntax-highlighted in the Nocturne preset, over the accent colors of all eight built-in themes";
export { size, contentType };

export default function Image() {
  return ogCard(
    "Build the editor theme you actually want to look at.",
    "VS Code · Neovim · Vim · Emacs · tmux · terminals — no account, nothing uploaded",
  );
}
