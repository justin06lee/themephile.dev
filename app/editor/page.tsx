import type { Metadata } from "next";
import { EditorApp } from "@/components/editor/EditorApp";

export const metadata: Metadata = {
  title: "Theme editor — themephile",
  description:
    "Design a syntax theme in the browser and export it to VS Code, Neovim, Vim, Emacs, and your terminal. No account required.",
};

export default function EditorPage() {
  return <EditorApp />;
}
