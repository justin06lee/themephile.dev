import { ANSI_ORDER, ROLE_IDS, type RoleId } from "@/lib/theme/roles";
import { slugify } from "@/lib/theme/serialize";
import type { Theme } from "@/lib/theme/theme";
import type { ExportTarget } from "./types";

type FaceSpec = {
  fg?: RoleId;
  bg?: RoleId;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Wavy underline in this color — Emacs' squiggle. */
  wave?: RoleId;
  box?: RoleId;
  inherit?: string;
};

/** roleId -> elisp-friendly symbol (`bgAlt` -> `bg-alt`). */
const sym = (id: string) => id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const FACES: [string, FaceSpec][] = [
  ["default", { fg: "fg", bg: "bg" }],
  ["cursor", { bg: "cursor" }],
  ["region", { bg: "selection" }],
  ["highlight", { bg: "currentLine" }],
  ["hl-line", { bg: "currentLine" }],
  ["fringe", { fg: "lineNumber", bg: "bg" }],
  ["vertical-border", { fg: "border" }],
  ["window-divider", { fg: "border" }],
  ["window-divider-first-pixel", { fg: "border" }],
  ["window-divider-last-pixel", { fg: "border" }],
  ["line-number", { fg: "lineNumber", bg: "bg" }],
  ["line-number-current-line", { fg: "lineNumberActive", bg: "currentLine", bold: true }],
  ["mode-line", { fg: "fg", bg: "bgAlt", box: "border" }],
  ["mode-line-inactive", { fg: "fgDim", bg: "bgAlt", box: "border" }],
  ["mode-line-buffer-id", { fg: "accent", bold: true }],
  ["header-line", { fg: "fg", bg: "bgAlt" }],
  ["minibuffer-prompt", { fg: "accent", bold: true }],
  ["isearch", { fg: "bg", bg: "accent", bold: true }],
  ["isearch-fail", { fg: "bg", bg: "error" }],
  ["lazy-highlight", { fg: "fg", bg: "matchBg" }],
  ["match", { fg: "fg", bg: "matchBg" }],
  ["show-paren-match", { fg: "accent", bold: true, underline: true }],
  ["show-paren-mismatch", { fg: "bg", bg: "error", bold: true }],
  ["secondary-selection", { bg: "matchBg" }],
  ["shadow", { fg: "fgDim" }],
  ["link", { fg: "info", underline: true }],
  ["link-visited", { fg: "keyword", underline: true }],
  ["error", { fg: "error", bold: true }],
  ["warning", { fg: "warning" }],
  ["success", { fg: "success" }],
  ["escape-glyph", { fg: "escape" }],
  ["trailing-whitespace", { bg: "error" }],
  ["tooltip", { fg: "fg", bg: "bgAlt" }],
  ["fill-column-indicator", { fg: "border" }],

  // ── font-lock ──
  ["font-lock-comment-face", { fg: "comment", italic: true }],
  ["font-lock-comment-delimiter-face", { fg: "comment", italic: true }],
  ["font-lock-doc-face", { fg: "comment", italic: true }],
  ["font-lock-doc-markup-face", { fg: "attribute" }],
  ["font-lock-string-face", { fg: "string" }],
  ["font-lock-keyword-face", { fg: "keyword" }],
  ["font-lock-builtin-face", { fg: "storage" }],
  ["font-lock-function-name-face", { fg: "function" }],
  ["font-lock-function-call-face", { fg: "function" }],
  ["font-lock-variable-name-face", { fg: "variable" }],
  ["font-lock-variable-use-face", { fg: "variable" }],
  ["font-lock-type-face", { fg: "type" }],
  ["font-lock-constant-face", { fg: "constant" }],
  ["font-lock-preprocessor-face", { fg: "attribute" }],
  ["font-lock-negation-char-face", { fg: "operator" }],
  ["font-lock-warning-face", { fg: "warning", bold: true }],
  ["font-lock-regexp-grouping-backslash", { fg: "escape" }],
  ["font-lock-regexp-grouping-construct", { fg: "escape", bold: true }],
  // Emacs 29+ adds these; older Emacs simply ignores unknown faces.
  ["font-lock-number-face", { fg: "number" }],
  ["font-lock-operator-face", { fg: "operator" }],
  ["font-lock-punctuation-face", { fg: "punctuation" }],
  ["font-lock-bracket-face", { fg: "punctuation" }],
  ["font-lock-delimiter-face", { fg: "punctuation" }],
  ["font-lock-misc-punctuation-face", { fg: "punctuation" }],
  ["font-lock-escape-face", { fg: "escape" }],
  ["font-lock-property-name-face", { fg: "property" }],
  ["font-lock-property-use-face", { fg: "property" }],
  ["font-lock-regexp-face", { fg: "escape" }],

  // ── diffs ──
  ["diff-added", { fg: "success" }],
  ["diff-removed", { fg: "error" }],
  ["diff-changed", { fg: "warning" }],
  ["diff-header", { fg: "fgDim", bg: "bgAlt" }],
  ["diff-file-header", { fg: "accent", bold: true }],
  ["diff-hl-insert", { fg: "success", bg: "success" }],
  ["diff-hl-delete", { fg: "error", bg: "error" }],
  ["diff-hl-change", { fg: "warning", bg: "warning" }],

  // ── completion UI ──
  ["company-tooltip", { fg: "fg", bg: "bgAlt" }],
  ["company-tooltip-selection", { bg: "selection", bold: true }],
  ["company-tooltip-common", { fg: "accent", bold: true }],
  ["company-tooltip-annotation", { fg: "type" }],
  ["company-scrollbar-bg", { bg: "bgAlt" }],
  ["company-scrollbar-fg", { bg: "border" }],
  ["vertico-current", { bg: "selection", bold: true }],
  ["orderless-match-face-0", { fg: "accent", bold: true }],
  ["ivy-current-match", { bg: "selection", bold: true }],

  // ── flycheck / flymake ──
  ["flycheck-error", { wave: "error" }],
  ["flycheck-warning", { wave: "warning" }],
  ["flycheck-info", { wave: "info" }],
  ["flymake-error", { wave: "error" }],
  ["flymake-warning", { wave: "warning" }],
  ["flymake-note", { wave: "info" }],

  // ── org ──
  ["org-level-1", { fg: "accent", bold: true }],
  ["org-level-2", { fg: "function", bold: true }],
  ["org-level-3", { fg: "type" }],
  ["org-level-4", { fg: "string" }],
  ["org-block", { fg: "fg", bg: "bgAlt" }],
  ["org-block-begin-line", { fg: "comment", bg: "bgAlt", italic: true }],
  ["org-code", { fg: "string" }],
  ["org-verbatim", { fg: "constant" }],
  ["org-todo", { fg: "error", bold: true }],
  ["org-done", { fg: "success", bold: true }],
  ["org-date", { fg: "info", underline: true }],
  ["org-table", { fg: "type" }],
  ["org-document-title", { fg: "accent", bold: true }],
];

function faceForm(name: string, spec: FaceSpec): string {
  const attrs: string[] = [];
  if (spec.fg) attrs.push(`:foreground ,${sym(spec.fg)}`);
  if (spec.bg) attrs.push(`:background ,${sym(spec.bg)}`);
  if (spec.box) attrs.push(`:box (:line-width 1 :color ,${sym(spec.box)})`);
  if (spec.bold) attrs.push(":weight bold");
  if (spec.italic) attrs.push(":slant italic");
  if (spec.underline) attrs.push(":underline t");
  if (spec.wave) attrs.push(`:underline (:style wave :color ,${sym(spec.wave)})`);
  if (spec.inherit) attrs.push(`:inherit ${spec.inherit}`);
  return `   \`(${name} ((,class (${attrs.join(" ")}))))`;
}

function elisp(t: Theme): string {
  const slug = slugify(t.name);
  const bindings = ROLE_IDS.map(
    (id) => `      (${sym(id)} "${t.colors[id]}")`,
  ).join("\n");
  const faces = FACES.map(([name, spec]) => faceForm(name, spec)).join("\n");
  const ansi = ANSI_ORDER.map((id) => `"${t.colors[id]}"`).join(" ");

  return `;;; ${slug}-theme.el --- ${t.name} -*- lexical-binding: t; -*-

;; Generated with themephile.dev
;; A ${t.appearance} theme with ${ROLE_IDS.length} editable roles.

;;; Commentary:
;; Save this file to ~/.emacs.d/themes/ and enable it with
;;   (load-theme '${slug} t)

;;; Code:

(deftheme ${slug}
  "${t.name} — generated with themephile.dev.")

(let ((class '((class color) (min-colors 89)))
${bindings})

  (custom-theme-set-faces
   '${slug}
${faces})

  (custom-theme-set-variables
   '${slug}
   \`(ansi-color-names-vector [${ansi}])))

;;;###autoload
(when (and (boundp 'custom-theme-load-path) load-file-name)
  (add-to-list 'custom-theme-load-path
               (file-name-as-directory (file-name-directory load-file-name))))

(provide-theme '${slug})

;;; ${slug}-theme.el ends here
`;
}

export const emacsTarget: ExportTarget = {
  id: "emacs",
  label: "Emacs",
  family: "editor",
  blurb:
    "A `deftheme` covering font-lock (including the Emacs 29 tree-sitter faces), org, diffs, and completion popups.",
  files: (t) => [
    {
      filename: `${slugify(t.name)}-theme.el`,
      language: "elisp",
      contents: elisp(t),
    },
  ],
  install: (t) => {
    const slug = slugify(t.name);
    return [
      `Save the file as \`~/.emacs.d/themes/${slug}-theme.el\` — the \`-theme.el\` suffix is required.`,
      "Tell Emacs where to look: `(add-to-list 'custom-theme-load-path \"~/.emacs.d/themes/\")`",
      `Load it: \`(load-theme '${slug} t)\` — or \`M-x load-theme RET ${slug}\`.`,
      "Reloading after an edit: `M-x load-theme` again, or `(disable-theme '" +
        slug +
        ")` first for a clean slate.",
    ];
  },
};
