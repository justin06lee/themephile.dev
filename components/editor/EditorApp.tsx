"use client";

import dynamic from "next/dynamic";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

/**
 * The editor restores your saved theme during its first render, which only
 * works in the browser — so it never renders on the server.
 *
 * The skeleton below is consequently the entire prerendered HTML for /editor,
 * which is why it carries the page's real heading and description. `rails`
 * matches EditorWorkspace's own geometry: 272px role list, 312px inspector,
 * and a 256px (h-64) top aside below the lg breakpoint.
 */
const EditorWorkspace = dynamic(
  () => import("./EditorWorkspace").then((m) => m.EditorWorkspace),
  {
    ssr: false,
    loading: () => (
      <WorkspaceSkeleton
        title="Theme editor"
        summary="Pick colors for all 48 syntax and interface roles against real code, then copy a finished colorscheme for VS Code, Neovim, Vim, Emacs, Alacritty, kitty, Ghostty, WezTerm, Windows Terminal, or plain JSON."
        points={[
          "The preview is drawn as VS Code, Neovim, Vim, Emacs, or a terminal — click any token in it to edit that color.",
          "Live WCAG contrast ratios for every role, and one button that lifts the failing ones without changing their hue.",
          "It all happens in this tab: no account, no upload, no analytics. Your theme lives in the URL and in local storage.",
        ]}
        other={{ href: "/tmux", label: "tmux studio" }}
        rails={{ left: 272, right: 312, mobileTop: 256 }}
      />
    ),
  },
);

export function EditorApp() {
  return <EditorWorkspace />;
}
