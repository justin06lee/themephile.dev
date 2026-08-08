import type { Metadata } from "next";
import { TmuxApp } from "@/components/tmux/TmuxApp";

export const metadata: Metadata = {
  title: "tmux studio",
  description:
    "Design your tmux status bar visually — segments, separators, colors, pane borders — and copy a ready-to-paste .tmux.conf. No account required.",
};

export default function TmuxPage() {
  return <TmuxApp />;
}
