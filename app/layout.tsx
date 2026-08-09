import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteGraph } from "@/lib/seo/schema";
import { AUTHOR_URL, openGraphBase, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `alternates` inherits into child segments, and `./` resolves to the root
  // rather than the current path — so every route sets its own canonical
  // explicitly. Without that, /editor and /tmux would both canonicalise to /.
  alternates: { canonical: "/" },
  applicationName: "themephile",
  title: {
    default: "themephile — free theme editor & tmux status bar builder",
    template: "%s · themephile",
  },
  description:
    "Design a syntax colorscheme against real code, then copy a finished config for VS Code, Neovim, Vim, Emacs, tmux, or your terminal. Free, no account.",
  authors: [{ name: "justin06lee", url: AUTHOR_URL }],
  creator: "justin06lee",
  openGraph: {
    ...openGraphBase,
    url: "/",
    title: "themephile — free theme editor & tmux status bar builder",
    description:
      "Design a syntax colorscheme against real code and export it to VS Code, Neovim, Vim, Emacs, tmux, and terminals. Free, no account, nothing uploaded.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // The payload here is the preview ceilings, not index/follow (already the
      // default). A tool whose whole pitch is how it looks should not accept a
      // thumbnail-sized image preview.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  // globals.css sets `color-scheme: dark` on :root, but only once the sheet
  // parses. The meta applies at document-parse time and kills the white flash.
  colorScheme: "dark",
  themeColor: "#06070a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd id="ld-site" data={siteGraph} />
        {children}
      </body>
    </html>
  );
}
