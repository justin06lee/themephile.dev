"use client";

import dynamic from "next/dynamic";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

/** Client-only for the same reason as the theme editor: it reads local state. */
const TmuxWorkspace = dynamic(
  () => import("./TmuxWorkspace").then((m) => m.TmuxWorkspace),
  { ssr: false, loading: () => <WorkspaceSkeleton label="tmux studio" /> },
);

export function TmuxApp() {
  return <TmuxWorkspace />;
}
