import { emacsTarget } from "./emacs";
import { neovimTarget } from "./neovim";
import {
  alacrittyTarget,
  ghosttyTarget,
  kittyTarget,
  rawTarget,
  weztermTarget,
  windowsTerminalTarget,
} from "./terminals";
import type { ExportTarget } from "./types";
import { vimTarget } from "./vim";
import { vscodeTarget } from "./vscode";

export const TARGETS: ExportTarget[] = [
  vscodeTarget,
  neovimTarget,
  vimTarget,
  emacsTarget,
  alacrittyTarget,
  kittyTarget,
  ghosttyTarget,
  weztermTarget,
  windowsTerminalTarget,
  rawTarget,
];

export const TARGET_FAMILIES: { id: ExportTarget["family"]; label: string }[] = [
  { id: "editor", label: "Editors" },
  { id: "terminal", label: "Terminals" },
  { id: "raw", label: "Raw" },
];

export type { ExportFile, ExportTarget } from "./types";
