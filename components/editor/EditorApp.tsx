"use client";

import dynamic from "next/dynamic";
import { WorkspaceSkeleton } from "@/components/ui/WorkspaceSkeleton";

/**
 * The editor restores your saved theme during its first render, which only
 * works in the browser — so it never renders on the server.
 */
const EditorWorkspace = dynamic(
  () => import("./EditorWorkspace").then((m) => m.EditorWorkspace),
  { ssr: false, loading: () => <WorkspaceSkeleton label="Theme editor" /> },
);

export function EditorApp() {
  return <EditorWorkspace />;
}
