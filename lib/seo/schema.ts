import type { JsonLdGraph, JsonLdNode } from "@/components/seo/JsonLd";
import { AUTHOR_URL, LICENSE_URL, REPO_URL, SITE_URL } from "@/lib/site";

/**
 * Every factual claim the site makes to a machine lives here, so it can be
 * reviewed on one screen and checked against the source.
 *
 * `Person`, not `Organization`: there is no company — no registration, no
 * address, no contact point, no legal name. `Organization` would assert an
 * entity that does not exist. `Person` with the GitHub handle asserts only what
 * github.com/justin06lee independently proves.
 *
 * `WebApplication`, not `SoftwareApplication`: the narrower subtype is literally
 * accurate (browser-only), and every consumer that understands the parent
 * understands the child.
 *
 * No `aggregateRating` or `review` anywhere. Those are the only thing that would
 * unlock Google's software-app rich result, and there are no genuine
 * first-party ratings to cite. A fabricated one is a manual action.
 */

const MIT = "https://opensource.org/license/mit";

/** Stable ids, so page graphs point at one entity instead of copying it. */
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const SOURCE_ID = `${SITE_URL}/#source`;

/** Rendered once, from the root layout. Every route inherits it. */
export const siteGraph: JsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "justin06lee",
      url: AUTHOR_URL,
      sameAs: [AUTHOR_URL],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: "themephile",
      alternateName: "themephile.dev",
      description:
        "A visual theme editor for code and a tmux status bar builder. Tune every syntax color against real code, then copy a finished config for your editor, your terminal, or tmux. No account, nothing uploaded.",
      inLanguage: "en",
      isAccessibleForFree: true,
      publisher: { "@id": PERSON_ID },
      sameAs: [REPO_URL],
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": SOURCE_ID,
      name: "themephile",
      codeRepository: REPO_URL,
      programmingLanguage: "TypeScript",
      license: MIT,
      author: { "@id": PERSON_ID },
      isAccessibleForFree: true,
    },
  ],
};

/** What both tools share: free, MIT, browser-only, same author, same site. */
const appDefaults = {
  "@type": "WebApplication",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with JavaScript enabled",
  inLanguage: "en",
  isAccessibleForFree: true,
  license: MIT,
  // price "0" is Google's documented encoding for a free application. Omitting
  // `offers` entirely would leave "is it free?" unanswered on a product whose
  // main selling point is that it is.
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@id": PERSON_ID },
  isPartOf: { "@id": WEBSITE_ID },
  sameAs: [REPO_URL],
} as const;

/** Home > tool. Only for the tool routes — a one-item trail is noise. */
function breadcrumb(path: string, name: string): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${path}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "themephile", item: `${SITE_URL}/` },
      // Google's guidance: the current page's ListItem omits `item`.
      { "@type": "ListItem", position: 2, name },
    ],
  };
}

export const editorGraph: JsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      ...appDefaults,
      "@id": `${SITE_URL}/editor#app`,
      name: "themephile theme editor",
      url: `${SITE_URL}/editor`,
      applicationSubCategory: "Syntax theme editor",
      description:
        "Design a syntax theme in the browser against live previews of VS Code, Neovim, Vim, Emacs and a terminal, then export a ready-to-install colorscheme.",
      featureList: [
        "48 editable syntax, interface and ANSI colour roles",
        "Live previews drawn as VS Code, Neovim, Vim, Emacs and a terminal",
        "Six preview languages: TypeScript/JSX, Python, Rust, Go, Lua and CSS",
        "OKLCh palette generation with live WCAG contrast ratios",
        "Exports to VS Code, Neovim, Vim, Emacs, Alacritty, kitty, Ghostty, WezTerm, Windows Terminal and JSON",
        "Runs entirely in the browser — no account, nothing uploaded",
      ],
    },
    breadcrumb("/editor", "Theme editor"),
  ],
};

export const tmuxGraph: JsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      ...appDefaults,
      "@id": `${SITE_URL}/tmux#app`,
      name: "themephile tmux studio",
      url: `${SITE_URL}/tmux`,
      applicationSubCategory: "tmux status bar builder",
      description:
        "Build a tmux status bar visually — segments, powerline separators, pane borders, prefix key — against a live terminal preview, then copy a complete .tmux.conf.",
      featureList: [
        "Reorderable status bar segments",
        "Powerline separator styles previewed without a Nerd Font",
        "Pane border, message and prefix-key configuration",
        "Live terminal preview that redraws as you edit",
        "Exports a complete .tmux.conf",
      ],
    },
    breadcrumb("/tmux", "tmux studio"),
  ],
};

export { LICENSE_URL };
