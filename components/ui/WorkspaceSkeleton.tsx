/**
 * Shown while a workspace bundle loads. Both editors read localStorage during
 * their first render, so they mount client-side only — this is what gets
 * prerendered into the static HTML in their place.
 */
export function WorkspaceSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex h-[53px] shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="size-4 rounded-[5px] bg-raised" />
        <span className="text-sm font-medium tracking-tight text-ink-dim">
          themephile
        </span>
        <span className="mx-1 h-5 w-px bg-line" />
        <span className="text-sm text-ink-faint">{label}</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[272px] shrink-0 border-r border-line lg:block" />
        <div className="flex flex-1 items-center justify-center">
          <span className="label animate-pulse">Loading…</span>
        </div>
        <div className="hidden w-[312px] shrink-0 border-l border-line lg:block" />
      </div>
    </div>
  );
}
