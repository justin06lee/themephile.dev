import { getTheme } from "@/lib/gallery/queries";
import { toEditorTheme } from "@/lib/gallery/theme";
import { ogCard, contentType, size } from "@/lib/seo/og-card";

export { contentType, size };

export const alt = "A themephile colour scheme";

/**
 * Every published theme gets a social card painted in its own palette. That's
 * the entire point of sharing one — a link preview showing our default colours
 * would be describing the wrong theme.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = await getTheme(slug);

  if (!theme) return ogCard("Theme gallery", "themephile.dev/themes");

  return ogCard(
    theme.name,
    `by ${theme.author.username} · ${theme.appearance} · themephile.dev`,
    toEditorTheme(theme),
  );
}
