import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthButton } from "@/components/gallery/AuthButton";
import { LikeButton } from "@/components/gallery/LikeButton";
import { ThemeShowcase } from "@/components/gallery/ThemeShowcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { getTheme, listAllSlugs } from "@/lib/gallery/queries";
import { toEditorTheme } from "@/lib/gallery/theme";
import { themeGraph } from "@/lib/seo/schema";
import { openGraphBase } from "@/lib/site";
import { encodeTheme } from "@/lib/theme/serialize";

export const revalidate = 300;

/**
 * Prebuild the themes that exist at deploy time; anything published since is
 * rendered on first request and then cached. An empty or unreachable database
 * must not fail the build — the editor and tmux studio don't depend on it.
 */
export async function generateStaticParams() {
  try {
    const slugs = await listAllSlugs(200);
    return slugs.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/themes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const theme = await getTheme(slug);
  if (!theme) return { title: "Theme not found" };

  const description =
    theme.blurb ??
    `A ${theme.appearance} colorscheme by ${theme.author.username}. Open it in the editor, or export it for VS Code, Neovim, Vim, Emacs, tmux and terminals.`;

  return {
    title: `${theme.name} — a ${theme.appearance} theme by ${theme.author.username}`,
    description,
    alternates: { canonical: `/themes/${theme.slug}` },
    openGraph: {
      ...openGraphBase,
      type: "article",
      url: `/themes/${theme.slug}`,
      title: `${theme.name} — ${theme.appearance} theme`,
      description,
      publishedTime: theme.createdAt,
      authors: [`https://github.com/${theme.author.username}`],
    },
  };
}

export default async function ThemePage({ params }: PageProps<"/themes/[slug]">) {
  const { slug } = await params;
  const theme = await getTheme(slug);
  if (!theme) notFound();

  // The whole palette rides in the fragment, so "open in editor" needs no
  // lookup on the way back and works even if the row is later deleted.
  const openHref = `/editor#t=${encodeTheme(toEditorTheme(theme))}`;

  return (
    <>
      <JsonLd id="ld-theme" data={themeGraph(theme)} />
      <SiteNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-ink-faint">
          <Link href="/themes" className="transition-colors hover:text-ink">
            Theme gallery
          </Link>
          <span aria-hidden> / </span>
          <span className="text-ink-dim">{theme.name}</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {theme.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-dim">
              {theme.author.avatarUrl && (
                <Image
                  src={theme.author.avatarUrl}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <Link
                href={`/themes?by=${encodeURIComponent(theme.author.username)}`}
                className="transition-colors hover:text-ink"
              >
                {theme.author.username}
              </Link>
              <span aria-hidden>·</span>
              <span>{theme.appearance}</span>
              <span aria-hidden>·</span>
              <time dateTime={theme.createdAt}>
                {new Date(theme.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </p>
            {theme.blurb && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim">
                {theme.blurb}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LikeButton themeId={theme.id} count={theme.likeCount} size="lg" />
            <Link href={openHref} className="btn btn-primary text-xs">
              Open in editor
            </Link>
            <AuthButton />
          </div>
        </header>

        <p className="mt-6 text-xs leading-relaxed text-ink-faint">
          Opening it in the editor loads the palette from the link — nothing is
          downloaded and your own saved theme is one ⌘Z away. From there,
          Export writes a config for VS Code, Neovim, Vim, Emacs, Alacritty,
          kitty, Ghostty, WezTerm, Windows Terminal, or plain JSON.
        </p>

        <div className="mt-8">
          <ThemeShowcase theme={theme} />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Link href={openHref} className="btn btn-primary text-xs">
            Open in editor
          </Link>
          <Link href="/themes" className="btn text-xs">
            Back to the gallery
          </Link>
          <Link href="/tmux" className="btn text-xs">
            Match it in tmux
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
