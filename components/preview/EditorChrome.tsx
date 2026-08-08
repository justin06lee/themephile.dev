"use client";

import type { ReactNode } from "react";
import type { RoleId } from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

type HitProps = {
  role: RoleId;
  onPick?: (role: RoleId) => void;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  title?: string;
};

/** Every piece of fake editor chrome is a target: click it, edit its color. */
function Hit({ role, onPick, active, className = "", style, children, title }: HitProps) {
  return (
    <div
      className={`${className} ${onPick ? "cursor-pointer" : ""} ${
        active ? "ring-1 ring-inset" : ""
      }`}
      style={{
        ...style,
        ...(active ? { boxShadow: "inset 0 0 0 1px currentColor" } : null),
      }}
      title={title ?? role}
      onClick={onPick ? () => onPick(role) : undefined}
    >
      {children}
    </div>
  );
}

type Props = {
  theme: Theme;
  filename: string;
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  activeRole?: RoleId | null;
  onPickRole?: (role: RoleId) => void;
  children: ReactNode;
  /** Fake file tree entries — purely decorative, but they sell the preview. */
  tree?: string[];
};

const DEFAULT_TREE = [
  "src/",
  "  color.ts",
  "  theme.ts",
  "  export/",
  "    neovim.lua",
  "README.md",
];

export function EditorChrome({
  theme,
  filename,
  tabs,
  activeTab,
  onTabChange,
  activeRole,
  onPickRole,
  children,
  tree = DEFAULT_TREE,
}: Props) {
  const c = theme.colors;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: c.border, background: c.bg }}
    >
      {/* title bar */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        active={activeRole === "bgAlt"}
        className="flex shrink-0 items-center gap-2 border-b px-3 py-2"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full" style={{ background: c.error }} />
          <i className="size-2.5 rounded-full" style={{ background: c.warning }} />
          <i className="size-2.5 rounded-full" style={{ background: c.success }} />
        </span>
        <span
          className="ml-2 truncate font-mono text-[11px]"
          style={{ color: c.fgDim }}
        >
          {filename}
        </span>
      </Hit>

      {/* tab strip */}
      <div
        className="flex shrink-0 items-stretch border-b text-[11px]"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative border-r px-3 py-2 font-mono transition-colors"
              style={{
                background: isActive ? c.bg : "transparent",
                color: isActive ? c.fg : c.fgDim,
                borderColor: c.border,
              }}
            >
              {isActive && (
                <span
                  className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: c.accent }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* file tree */}
        <Hit
          role="bgAlt"
          onPick={onPickRole}
          className="hidden w-44 shrink-0 flex-col gap-0.5 border-r py-2 font-mono text-[11px] lg:flex"
          style={{ background: c.bgAlt, borderColor: c.border }}
        >
          <div className="px-3 pb-1.5 text-[9px] tracking-[0.14em] uppercase" style={{ color: c.lineNumber }}>
            Explorer
          </div>
          {tree.map((entry, i) => {
            const selected = i === 1;
            return (
              <div
                key={entry}
                className="truncate px-3 py-[3px]"
                style={{
                  color: selected ? c.fg : c.fgDim,
                  background: selected ? c.selection : "transparent",
                }}
              >
                {entry.replace(/^(\s*)/, (m) => " ".repeat(m.length))}
              </div>
            );
          })}
          <div className="mt-auto px-3 pt-2 text-[10px]" style={{ color: c.success }}>
            + 24 <span style={{ color: c.error }}>− 7</span>
          </div>
        </Hit>

        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>

      {/* status line */}
      <Hit
        role="bgAlt"
        onPick={onPickRole}
        className="flex shrink-0 items-center gap-3 border-t px-3 py-1.5 font-mono text-[10px]"
        style={{ background: c.bgAlt, borderColor: c.border }}
      >
        <span
          className="rounded px-1.5 py-0.5 font-medium"
          style={{ background: c.accent, color: c.bg }}
        >
          NORMAL
        </span>
        <span style={{ color: c.fgDim }}>main</span>
        <span style={{ color: c.error }}>✗ 2</span>
        <span style={{ color: c.warning }}>▲ 5</span>
        <span style={{ color: c.info }}>ℹ 1</span>
        <span className="ml-auto" style={{ color: c.fgDim }}>
          utf-8 · LF · Ln 24, Col 8
        </span>
      </Hit>
    </div>
  );
}
