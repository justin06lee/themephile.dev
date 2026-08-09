import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { TmuxApp } from "@/components/tmux/TmuxApp";
import { tmuxGraph } from "@/lib/seo/schema";
import { openGraphBase } from "@/lib/site";

export const metadata: Metadata = {
  // "tmux studio" is a product name nobody searches for; the title takes the
  // query and the h1 keeps the product name.
  title: "tmux status bar generator & .tmux.conf builder",
  description:
    "Build a tmux status bar visually — segments, powerline separators, pane borders, prefix key — then copy a complete .tmux.conf. Free, runs in your browser.",
  alternates: { canonical: "/tmux" },
  openGraph: {
    ...openGraphBase,
    url: "/tmux",
    title: "themephile tmux studio — build a .tmux.conf visually",
    description:
      "Design your tmux status bar against a live terminal and copy a ready-to-paste .tmux.conf.",
  },
};

export default function TmuxPage() {
  return (
    <>
      <JsonLd id="ld-tmux" data={tmuxGraph} />
      <TmuxApp />
    </>
  );
}
