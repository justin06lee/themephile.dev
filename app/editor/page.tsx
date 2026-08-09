import type { Metadata } from "next";
import { EditorApp } from "@/components/editor/EditorApp";
import { JsonLd } from "@/components/seo/JsonLd";
import { editorGraph } from "@/lib/seo/schema";
import { openGraphBase } from "@/lib/site";

export const metadata: Metadata = {
  // The root layout's `%s · themephile` template appends the brand, so this
  // must not carry it too — it previously rendered as
  // "Theme editor — themephile · themephile".
  title: "Free theme editor for VS Code, Neovim & Emacs",
  description:
    "Pick colors for 48 syntax and UI roles against live VS Code, Neovim, Vim, Emacs and terminal previews, with WCAG contrast checks. Free, no account.",
  alternates: { canonical: "/editor" },
  openGraph: {
    // Spread required: setting `openGraph` replaces the layout's object whole.
    ...openGraphBase,
    url: "/editor",
    title: "themephile theme editor — VS Code, Neovim, Vim, Emacs",
    description:
      "Tune 48 syntax roles against real code and copy a finished config. Runs in your browser, no account.",
  },
};

export default function EditorPage() {
  return (
    <>
      <JsonLd id="ld-editor" data={editorGraph} />
      <EditorApp />
    </>
  );
}
