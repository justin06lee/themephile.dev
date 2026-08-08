"use client";

import type { CSSProperties, ReactNode } from "react";
import type { RoleId } from "@/lib/theme/roles";

/**
 * A clickable region of fake chrome. Every part of every mock-up is a target:
 * click the status line, edit the status line's color.
 */
export function Hit({
  role,
  onPick,
  active,
  className = "",
  style,
  children,
  title,
  as: Tag = "div",
}: {
  role: RoleId;
  onPick?: (role: RoleId) => void;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  title?: string;
  as?: "div" | "span";
}) {
  return (
    <Tag
      className={`${className} ${onPick ? "cursor-pointer" : ""}`}
      style={{
        ...style,
        ...(active ? { boxShadow: "inset 0 0 0 1px currentColor" } : null),
      }}
      title={title ?? role}
      onClick={
        onPick
          ? (e: React.MouseEvent) => {
              e.stopPropagation();
              onPick(role);
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}

/** The window frame every preview sits in — traffic lights and a title. */
export function WindowFrame({
  bg,
  border,
  titleBg,
  titleFg,
  title,
  dots,
  right,
  children,
  onPick,
  titleRole = "bgAlt",
  activeRole,
}: {
  bg: string;
  border: string;
  titleBg: string;
  titleFg: string;
  title: string;
  dots: [string, string, string];
  right?: ReactNode;
  children: ReactNode;
  onPick?: (role: RoleId) => void;
  titleRole?: RoleId;
  activeRole?: RoleId | null;
}) {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: border, background: bg }}
    >
      <Hit
        role={titleRole}
        onPick={onPick}
        active={activeRole === titleRole}
        className="flex shrink-0 items-center gap-2 border-b px-3 py-2"
        style={{ background: titleBg, borderColor: border }}
      >
        <span className="flex gap-1.5">
          <i className="size-2.5 rounded-full" style={{ background: dots[0] }} />
          <i className="size-2.5 rounded-full" style={{ background: dots[1] }} />
          <i className="size-2.5 rounded-full" style={{ background: dots[2] }} />
        </span>
        <span className="ml-2 truncate font-mono text-[11px]" style={{ color: titleFg }}>
          {title}
        </span>
        {right && <span className="ml-auto">{right}</span>}
      </Hit>
      {children}
    </div>
  );
}
