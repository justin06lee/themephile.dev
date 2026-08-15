import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/gallery/AuthButton";
import { ThemeCard } from "@/components/gallery/ThemeCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteNav } from "@/components/site/SiteNav";
import { countThemes, listThemes, PAGE_SIZE, SORTS, type Sort } from "@/lib/gallery/queries";
import { galleryGraph } from "@/lib/seo/schema";
import { galleryEnabled } from "@/lib/supabase/config";
import { openGraphBase } from "@/lib/site";

export const metadata: Metadata = {
  title: "Theme gallery — colorschemes for VS Code, Neovim & terminals",
  description:
    "Colorschemes published by the community. Open any of them in the editor, change what you want, and export to VS Code, Neovim, Vim, Emacs, tmux or your terminal. Free, no account to browse.",
  // Sort, filter and search all render the same set of themes in a different
  // order. One canonical, so none of them compete with each other.
  alternates: { canonical: "/themes" },
  openGraph: {
    ...openGraphBase,
    url: "/themes",
    title: "themephile theme gallery",
    description:
      "Community colorschemes for VS Code, Neovim, Vim, Emacs and terminals. Open one in the editor and make it yours.",
  },
};

// The gallery changes when someone publishes, which is not often enough to
// pay for a database round trip on every request.
export const revalidate = 60;

export default async function ThemesPage({ searchParams }: PageProps<"/themes">) {
  const params = await searchParams;
  const single = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const sort: Sort = single(params.sort) === "new" ? "new" : "top";
  const appearanceParam = single(params.appearance);
  const appearance =
    appearanceParam === "dark" || appearanceParam === "light" ? appearanceParam : undefined;
  const query = single(params.q) ?? "";
  const author = single(params.by) ?? "";
  const page = Math.max(0, Number(single(params.page) ?? 0) || 0);

  const [{ themes, hasMore }, total] = await Promise.all([
    listThemes({ sort, appearance, query, author, page }),
    countThemes(),
  ]);

  const linkTo = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { sort, appearance, q: query, by: author, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "sort" && value === "top")) next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `/themes?${qs}` : "/themes";
  };

  return (
    <>
      <JsonLd id="ld-gallery" data={galleryGraph(themes, total)} />
      <SiteNav />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Theme gallery
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim">
              Colorschemes people have published. Open any of them in the editor,
              change whatever you want, and export it for your editor or terminal.
              Browsing needs no account — only publishing and liking do.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/editor" className="btn btn-primary text-xs">
              Make one
            </Link>
            <AuthButton />
          </div>
        </div>

        {!galleryEnabled ? (
          <Notice
            title="The gallery isn't configured here"
            body="This build has no NEXT_PUBLIC_SUPABASE_URL, so there's nothing to list. The editor and tmux studio work without it — see .env.example."
          />
        ) : (
          <>
            <nav className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line pb-3">
              {SORTS.map((s) => (
                <Chip key={s.id} href={linkTo({ sort: s.id })} active={sort === s.id}>
                  {s.label}
                </Chip>
              ))}
              <span className="mx-2 hidden h-4 w-px bg-line sm:block" />
              <Chip href={linkTo({ appearance: undefined })} active={!appearance}>
                All
              </Chip>
              <Chip href={linkTo({ appearance: "dark" })} active={appearance === "dark"}>
                Dark
              </Chip>
              <Chip href={linkTo({ appearance: "light" })} active={appearance === "light"}>
                Light
              </Chip>

              <form action="/themes" className="ml-auto flex items-center gap-2">
                {sort !== "top" && <input type="hidden" name="sort" value={sort} />}
                {appearance && <input type="hidden" name="appearance" value={appearance} />}
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name"
                  aria-label="Search themes by name"
                  className="w-40 rounded-md border border-line bg-sunken px-2.5 py-1.5 text-[13px] outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--accent)]"
                />
              </form>
            </nav>

            {author && (
              <p className="mt-4 text-sm text-ink-dim">
                Themes by <strong className="font-medium text-ink">{author}</strong>.{" "}
                <Link href={linkTo({ by: undefined })} className="underline hover:text-ink">
                  Show everyone
                </Link>
              </p>
            )}

            {themes.length === 0 ? (
              <Notice
                title={query || author ? "Nothing matched" : "No themes yet"}
                body={
                  query || author
                    ? "Try a different name, or clear the filters."
                    : "Be the first — build a theme in the editor and hit Publish."
                }
              />
            ) : (
              <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => (
                  <li key={theme.id}>
                    <ThemeCard theme={theme} />
                  </li>
                ))}
              </ol>
            )}

            {(page > 0 || hasMore) && (
              <div className="mt-8 flex items-center justify-between">
                {page > 0 ? (
                  <Link href={linkTo({ page: String(page - 1) })} className="btn text-xs">
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-ink-faint">
                  {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + themes.length} of {total}
                </span>
                {hasMore ? (
                  <Link href={linkTo({ page: String(page + 1) })} className="btn text-xs">
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
        active ? "bg-raised text-ink" : "text-ink-dim hover:bg-raised/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-line p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-dim">{body}</p>
    </div>
  );
}
