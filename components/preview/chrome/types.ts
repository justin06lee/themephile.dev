import type { LangId } from "@/lib/highlight/tokenize";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

/** Every preview chrome takes the same inputs and draws a different program. */
export type ChromeProps = {
  theme: Theme;
  lang: LangId;
  code: string;
  filename: string;
  activeRole?: RoleId | null;
  onPickRole?: (role: RoleId) => void;
};
