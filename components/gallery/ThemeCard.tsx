import Image from "next/image";
import Link from "next/link";
import type { GalleryTheme } from "@/lib/gallery/theme";
import { ANSI_ORDER } from "@/lib/theme/roles";
import { LikeButton } from "./LikeButton";
import { AnsiStrip, MiniPreview } from "./MiniPreview";

export function ThemeCard({ theme }: { theme: GalleryTheme }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-sunken transition-colors hover:border-ink-faint/60">
      <Link
        href={`/themes/${theme.slug}`}
        // Stretched link: the whole card is the target, but the like button
        // sits above it in the stacking order so it stays independently
        // clickable without nesting a button inside an anchor.
        className="absolute inset-0 z-0"
        aria-label={`${theme.name} by ${theme.author.username}`}
      />

      <div className="pointer-events-none border-b border-line">
        <MiniPreview colors={theme.colors} />
        <AnsiStrip colors={theme.colors} order={ANSI_ORDER} />
      </div>

      <div className="flex min-w-0 items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-medium">{theme.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
            {theme.author.avatarUrl && (
              <Image
                src={theme.author.avatarUrl}
                alt=""
                width={14}
                height={14}
                className="rounded-full"
                unoptimized
              />
            )}
            <span className="truncate">{theme.author.username}</span>
            <span aria-hidden>·</span>
            <span>{theme.appearance}</span>
          </p>
        </div>

        <div className="relative z-10">
          <LikeButton themeId={theme.id} count={theme.likeCount} />
        </div>
      </div>
    </article>
  );
}
