"use client";

import type { ReactNode } from "react";

export function Section({
  title,
  children,
  hint,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <h3 className="label pb-1">{title}</h3>
      {hint && <p className="pb-3 text-[11px] leading-relaxed text-ink-faint">{hint}</p>}
      <div className={`flex flex-col gap-2.5 ${hint ? "" : "pt-2"}`}>{children}</div>
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-ink-dim">{label}</div>
        {hint && <div className="text-[11px] text-ink-faint">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[22px] w-[38px] rounded-full border transition-colors"
      style={{
        background: checked ? "var(--accent)" : "var(--color-raised)",
        borderColor: checked ? "transparent" : "var(--color-line)",
      }}
    >
      <span
        className="absolute top-[2px] size-[16px] rounded-full bg-white transition-[left] duration-150"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-line bg-sunken p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-[11.5px] transition-colors ${
            opt.value === value
              ? "bg-raised text-ink"
              : "text-ink-faint hover:text-ink-dim"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded-md border border-line bg-sunken px-2 py-1 text-right font-mono text-xs outline-none focus:border-ink-faint"
      />
      {suffix && <span className="font-mono text-[10px] text-ink-faint">{suffix}</span>}
    </div>
  );
}
