"use client";

import dynamic from "next/dynamic";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

/**
 * Client-only for the same reason as the theme editor: it reads local state.
 *
 * `rails` has no left column and a 368px right one, because that is what
 * TmuxWorkspace actually renders — the previous skeleton claimed a 272px left
 * rail this route does not have, and shifted the layout on mount.
 */
const TmuxWorkspace = dynamic(
  () => import("./TmuxWorkspace").then((m) => m.TmuxWorkspace),
  {
    ssr: false,
    loading: () => (
      <WorkspaceSkeleton
        title="tmux studio"
        summary="Build a tmux status bar by looking at it — reorder segments, switch powerline separators, set pane borders and the prefix key — then copy a complete .tmux.conf for tmux 3.0 and up."
        points={[
          "A live terminal preview redraws as you edit. Powerline separators are drawn as CSS shapes, so you don't need a Nerd Font to see them.",
          "The exported config covers the status bar, panes, messages, and key bindings, using the real U+E0B0 glyphs.",
          "It all happens in this tab: no account, no upload, no analytics.",
        ]}
        other={{ href: "/editor", label: "Theme editor" }}
        rails={{ right: 368 }}
      />
    ),
  },
);

export function TmuxApp() {
  return <TmuxWorkspace />;
}
