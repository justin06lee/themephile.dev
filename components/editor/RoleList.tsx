"use client";

import { useMemo, useState } from "react";
import { contrastRatio, readableOn } from "@/lib/color";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  ROLES,
  type RoleGroup,
  type RoleId,
} from "@/lib/theme/roles";
import type { Theme } from "@/lib/theme/theme";

type Props = {
  theme: Theme;
  selected: RoleId;
  onSelect: (role: RoleId) => void;
};

export function RoleList({ theme, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUP_ORDER.map((group) => ({
      group,
      roles: ROLES.filter(
        (r) =>
          r.group === group &&
          (!q ||
            r.label.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.hint.toLowerCase().includes(q)),
      ),
    })).filter((g) => g.roles.length > 0);
  }, [query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter roles…"
          className="w-full rounded-md border border-line bg-sunken px-2.5 py-1.5 text-xs outline-none placeholder:text-ink-faint focus:border-ink-faint"
          aria-label="Filter roles"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {groups.map(({ group, roles }) => (
          <section key={group} className="pt-4">
            <h3 className="label px-2 pb-2">{GROUP_LABELS[group]}</h3>

            {group === "ansi" ? (
              <AnsiGrid
                theme={theme}
                roles={roles.map((r) => r.id as RoleId)}
                selected={selected}
                onSelect={onSelect}
              />
            ) : (
              <ul className="flex flex-col">
                {roles.map((role) => (
                  <RoleRow
                    key={role.id}
                    id={role.id as RoleId}
                    label={role.label}
                    hint={role.hint}
                    group={role.group}
                    theme={theme}
                    active={selected === role.id}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}

        {groups.length === 0 && (
          <p className="px-2 pt-6 text-xs text-ink-faint">No roles match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

function RoleRow({
  id,
  label,
  hint,
  group,
  theme,
  active,
  onSelect,
}: {
  id: RoleId;
  label: string;
  hint: string;
  group: RoleGroup;
  theme: Theme;
  active: boolean;
  onSelect: (role: RoleId) => void;
}) {
  const hex = theme.colors[id];
  // Surfaces and the background itself aren't "text on canvas", so a contrast
  // warning there would be noise.
  const checks = group === "syntax" || group === "diagnostic" || id === "fg";
  const ratio = checks ? contrastRatio(hex, theme.colors.bg) : null;
  const low = ratio !== null && ratio < 3;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id)}
        title={hint}
        className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
          active ? "bg-raised" : "hover:bg-raised/60"
        }`}
      >
        <span
          className="size-5 shrink-0 rounded border"
          style={{
            background: hex,
            borderColor: active ? "var(--accent)" : "var(--color-line)",
            boxShadow: active ? "0 0 0 1px var(--accent)" : undefined,
          }}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[13px] ${active ? "text-ink" : "text-ink-dim group-hover:text-ink"}`}
          >
            {label}
          </span>
        </span>
        {low && (
          <span
            title={`Contrast ${ratio.toFixed(1)}:1 against the background`}
            className="shrink-0 font-mono text-[9px] text-amber-400/80"
          >
            {ratio.toFixed(1)}
          </span>
        )}
        <span className="shrink-0 font-mono text-[10px] text-ink-faint uppercase">
          {hex.replace("#", "")}
        </span>
      </button>
    </li>
  );
}

function AnsiGrid({
  theme,
  roles,
  selected,
  onSelect,
}: {
  theme: Theme;
  roles: RoleId[];
  selected: RoleId;
  onSelect: (role: RoleId) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1 px-2">
      {roles.map((id) => {
        const hex = theme.colors[id];
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            title={`${id} · ${hex}`}
            className="grid aspect-square place-items-center rounded border font-mono text-[8px] transition-transform hover:scale-105"
            style={{
              background: hex,
              color: readableOn(hex),
              borderColor: active ? "var(--accent)" : "var(--color-line)",
              boxShadow: active ? "0 0 0 2px var(--accent)" : undefined,
            }}
          >
            {id.startsWith("ansiBright") ? "+" : ""}
          </button>
        );
      })}
    </div>
  );
}
