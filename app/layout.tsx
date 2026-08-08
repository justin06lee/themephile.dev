import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://themephile.dev"),
  title: {
    default: "themephile — build your editor theme, no login",
    template: "%s · themephile",
  },
  description:
    "A visual theme editor for code. Tune every syntax color against real code, then copy a ready-made config for VS Code, Neovim, Vim, Emacs, tmux, and your terminal. No account, nothing uploaded.",
  keywords: [
    "theme editor",
    "colorscheme generator",
    "vscode theme",
    "neovim colorscheme",
    "vim colorscheme",
    "emacs theme",
    "tmux config",
    "syntax highlighting",
  ],
  openGraph: {
    title: "themephile — build your editor theme, no login",
    description:
      "Design a syntax theme against real code and export it to VS Code, Neovim, Vim, Emacs, tmux, and terminals.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
