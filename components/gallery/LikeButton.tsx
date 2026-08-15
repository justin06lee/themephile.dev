"use client";

import { useState } from "react";
import { useSession } from "./session";

/**
 * The count is rendered on the server and already includes your own like if
 * you have one — the server has no idea who is asking, it just knows the
 * total. So this tracks a delta from that number rather than recomputing it:
 * adding `mine ? 1 : 0` would double-count every theme you'd already liked.
 */
export function LikeButton({
  themeId,
  count,
  size = "sm",
}: {
  themeId: string;
  count: number;
  size?: "sm" | "lg";
}) {
  const { liked, toggleLike, user } = useSession();
  const [delta, setDelta] = useState(0);
  const mine = liked.has(themeId);

  const onClick = async (e: React.MouseEvent) => {
    // Cards are links; liking one shouldn't navigate into it.
    e.preventDefault();
    e.stopPropagation();

    const step = mine ? -1 : 1;
    setDelta((d) => d + step);
    if ((await toggleLike(themeId)) === null) setDelta((d) => d - step);
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={mine}
      aria-label={mine ? "Remove your like" : "Like this theme"}
      title={user ? (mine ? "Remove your like" : "Like this theme") : "Sign in to like"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md transition-colors ${
        size === "lg" ? "px-2.5 py-1.5 text-[13px]" : "px-1.5 py-1 text-[11px]"
      } ${mine ? "text-rose-300" : "text-ink-faint hover:text-ink"}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className={size === "lg" ? "size-4" : "size-3.5"}
        fill={mine ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M10 16.5S3 12.4 3 7.9A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7 2.3c0 4.5-7 8.6-7 8.6z" />
      </svg>
      <span className="tabular-nums">{Math.max(0, count + delta)}</span>
    </button>
  );
}
