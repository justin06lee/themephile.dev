"use client";

import { useCallback, useRef, useState } from "react";
import {
  darken,
  hexToHsv,
  hexToOklch,
  hsvToHex,
  isValidHex,
  lighten,
  normalizeHex,
  readableOn,
  saturate,
} from "@/lib/color";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  /** Fires once at the end of a drag, so undo history gets one entry, not 200. */
  onCommit?: (hex: string) => void;
};

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export function ColorPicker({ value, onChange, onCommit }: Props) {
  const [hue, setHue] = useState(() => hexToHsv(value).h);
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Re-sync when the color changes from outside (a new role, undo, a preset).
  // Adjusting state during render beats an effect: no extra commit, no flash.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
    const next = hexToHsv(value);
    // Sticky hue: dragging down to black or gray shouldn't reset the wheel.
    if (next.s > 0.02 && next.v > 0.02) setHue(next.h);
  }

  const commit = () => onCommit?.(value);

  return (
    <div className="flex flex-col gap-3">
      <SaturationField
        hue={hue}
        value={value}
        onChange={(s, v) => onChange(hsvToHex({ h: hue, s, v }))}
        onCommit={commit}
      />

      <HueSlider
        hue={hue}
        onChange={(h) => {
          setHue(h);
          const cur = hexToHsv(value);
          onChange(hsvToHex({ h, s: cur.s || 0.6, v: cur.v || 0.8 }));
        }}
        onCommit={commit}
      />

      <div className="flex items-center gap-2">
        <div
          className="grid size-9 shrink-0 place-items-center rounded-md border border-line font-mono text-[9px]"
          style={{ background: value, color: readableOn(value) }}
        >
          Aa
        </div>
        <input
          value={draft}
          spellCheck={false}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (isValidHex(next)) onChange(normalizeHex(next));
          }}
          onBlur={() => {
            if (isValidHex(draft)) onCommit?.(normalizeHex(draft));
            else setDraft(value);
          }}
          className="min-w-0 flex-1 rounded-md border border-line bg-sunken px-2.5 py-2 font-mono text-xs tracking-wide uppercase outline-none focus:border-ink-faint"
          aria-label="Hex value"
        />
        <EyeDropperButton onPick={(hex) => onCommit?.(normalizeHex(hex))} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Nudge label="Lighter" onClick={() => onCommit?.(lighten(value, 0.05))} />
        <Nudge label="Darker" onClick={() => onCommit?.(darken(value, 0.05))} />
        <Nudge label="Vivid" onClick={() => onCommit?.(saturate(value, 1.2))} />
        <Nudge label="Muted" onClick={() => onCommit?.(saturate(value, 0.8))} />
      </div>

      <Oklch hex={value} />
    </div>
  );
}

function Nudge({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-line-soft bg-raised px-2 py-1 font-mono text-[10px] text-ink-dim transition-colors hover:border-line hover:text-ink"
    >
      {label}
    </button>
  );
}

function Oklch({ hex }: { hex: string }) {
  const { l, c, h } = hexToOklch(hex);
  return (
    <div className="flex justify-between font-mono text-[10px] text-ink-faint">
      <span>L {(l * 100).toFixed(1)}</span>
      <span>C {c.toFixed(3)}</span>
      <span>H {h.toFixed(0)}°</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   fields                                   */
/* -------------------------------------------------------------------------- */

/** Shared pointer-drag plumbing: normalized 0..1 coordinates within the element. */
function useDragArea(
  onMove: (x: number, y: number) => void,
  onCommit?: () => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const report = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01((event.clientY - rect.top) / rect.height);
      onMove(x, y);
    },
    [onMove],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    report(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) report(e);
  };
  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onCommit?.();
  };

  return { ref, onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function SaturationField({
  hue,
  value,
  onChange,
  onCommit,
}: {
  hue: number;
  value: string;
  onChange: (s: number, v: number) => void;
  onCommit: () => void;
}) {
  const { s, v } = hexToHsv(value);
  const drag = useDragArea((x, y) => onChange(x, 1 - y), onCommit);

  return (
    <div
      {...drag}
      className="relative h-36 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-line"
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))`,
      }}
      role="application"
      aria-label="Saturation and brightness"
    >
      <span
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: value }}
      />
    </div>
  );
}

function HueSlider({
  hue,
  onChange,
  onCommit,
}: {
  hue: number;
  onChange: (h: number) => void;
  onCommit: () => void;
}) {
  const drag = useDragArea((x) => onChange(x * 360), onCommit);

  return (
    <div
      {...drag}
      className="relative h-3.5 w-full cursor-ew-resize touch-none rounded-full border border-line"
      style={{
        background:
          "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
      }}
      role="slider"
      aria-label="Hue"
      aria-valuenow={Math.round(hue)}
      aria-valuemin={0}
      aria-valuemax={360}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange((hue + 359) % 360);
        if (e.key === "ArrowRight") onChange((hue + 1) % 360);
      }}
    >
      <span
        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue} 100% 50%)` }}
      />
    </div>
  );
}

function EyeDropperButton({ onPick }: { onPick: (hex: string) => void }) {
  // Chromium-only API. The `typeof` guard keeps this safe if the picker ever
  // ends up in a server-rendered tree.
  const [supported] = useState(
    () => typeof window !== "undefined" && "EyeDropper" in window,
  );
  if (!supported) return null;

  return (
    <button
      type="button"
      title="Pick a color from anywhere on screen"
      aria-label="Pick a color from screen"
      className="btn shrink-0 px-2"
      onClick={async () => {
        try {
          const Ctor = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
          const { sRGBHex } = await new Ctor().open();
          onPick(sRGBHex);
        } catch {
          // The user hit escape. Nothing to do.
        }
      }}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M10.5 2.5a1.8 1.8 0 0 1 2.6 2.5l-1.3 1.3 1 1-1.2 1.2-1-1L5.9 13H3v-2.9l6.5-6.5-1-1L9.7 1.4l1 1z" />
      </svg>
    </button>
  );
}
