import { contentType, ogCard, size } from "@/lib/seo/og-card";

export const alt =
  "themephile theme editor: a TypeScript file syntax-highlighted in the Nocturne preset, over the accent colors of all eight built-in themes";
export { size, contentType };

export default function Image() {
  return ogCard(
    "Design a syntax theme against real code.",
    "48 roles · VS Code, Neovim, Vim, Emacs, terminals — free, no account",
  );
}
