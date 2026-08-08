"use client";

import {
  buildSegments,
  isFilled,
  MODULES,
  type SeparatorId,
  type TmuxConfig,
} from "@/lib/tmux/config";

/**
 * The status bar, drawn with CSS instead of Powerline glyphs.
 *
 * Browsers don't have a Nerd Font, so rendering the real  would show tofu.
 * Clip-path shapes give the identical silhouette everywhere, and the exported
 * config still uses the proper glyphs.
 */
const SHAPES: Record<
  Exclude<SeparatorId, "none" | "bar">,
  { left: string; right: string; width: number }
> = {
  powerline: {
    left: "polygon(0 0, 100% 50%, 0 100%)",
    right: "polygon(100% 0, 0 50%, 100% 100%)",
    width: 10,
  },
  round: {
    left: "ellipse(100% 50% at 0% 50%)",
    right: "ellipse(100% 50% at 100% 50%)",
    width: 9,
  },
  slant: {
    left: "polygon(0 0, 100% 0, 0 100%)",
    right: "polygon(100% 0, 100% 100%, 0 100%)",
    width: 11,
  },
};

function Sep({
  from,
  to,
  separator,
  side,
}: {
  from: string;
  to: string;
  separator: SeparatorId;
  side: "left" | "right";
}) {
  if (separator === "none" || separator === "bar") return null;
  const shape = SHAPES[separator];
  return (
    <span
      aria-hidden
      className="self-stretch"
      style={{ background: to, width: shape.width, flex: "0 0 auto" }}
    >
      <span
        className="block h-full w-full"
        style={{ background: from, clipPath: shape[side] }}
      />
    </span>
  );
}

type Window = { index: number; name: string; active?: boolean; zoomed?: boolean };

const DEFAULT_WINDOWS: Window[] = [
  { index: 1, name: "editor", active: true },
  { index: 2, name: "server" },
  { index: 3, name: "logs" },
];

export function TmuxStatusBar({
  config,
  windows = DEFAULT_WINDOWS,
  fontSize = 12,
}: {
  config: TmuxConfig;
  windows?: Window[];
  fontSize?: number;
}) {
  const c = config.colors;
  const filled = isFilled(config.separator);
  const left = buildSegments(config.left, c, "left", filled);
  const right = buildSegments(config.right, c, "right", filled);

  const justify =
    config.justify === "centre"
      ? "justify-center"
      : config.justify === "right"
        ? "justify-end"
        : "justify-start";

  const label = (w: Window) =>
    `${config.showWindowIndex ? `${w.index}:` : ""}${w.name}${
      config.showZoomFlag && w.zoomed ? " [Z]" : ""
    }`;

  return (
    <div
      className="flex h-[26px] w-full shrink-0 items-stretch overflow-hidden font-mono whitespace-nowrap"
      style={{ background: c.statusBg, color: c.statusFg, fontSize }}
    >
      {/* status-left */}
      <div className="flex shrink-0 items-stretch">
        {left.map((seg, i) => (
          <span key={seg.id} className="flex items-stretch">
            <span
              className="flex items-center px-2 font-semibold"
              style={{ background: seg.bg, color: seg.fg }}
              title={MODULES[seg.id as keyof typeof MODULES]?.tmux}
            >
              {seg.sample}
            </span>
            <Sep
              from={seg.bg}
              to={left[i + 1]?.bg ?? c.statusBg}
              separator={config.separator}
              side="left"
            />
            {!filled && config.separator === "bar" && i < left.length - 1 && (
              <span className="flex items-center opacity-50">│</span>
            )}
          </span>
        ))}
      </div>

      {/* window list */}
      <div className={`flex flex-1 items-stretch overflow-hidden ${justify}`}>
        {windows.map((w) =>
          w.active && filled ? (
            <span key={w.index} className="flex items-stretch">
              <Sep
                from={c.activeWindowBg}
                to={c.statusBg}
                separator={config.separator}
                side="right"
              />
              <span
                className="flex items-center px-2 font-semibold"
                style={{ background: c.activeWindowBg, color: c.activeWindowFg }}
              >
                {label(w)}
              </span>
              <Sep
                from={c.activeWindowBg}
                to={c.statusBg}
                separator={config.separator}
                side="left"
              />
            </span>
          ) : (
            <span
              key={w.index}
              className="flex items-center px-2"
              style={{
                color: w.active ? c.activeWindowBg : c.windowFg,
                fontWeight: w.active ? 600 : 400,
              }}
            >
              {label(w)}
            </span>
          ),
        )}
      </div>

      {/* status-right */}
      <div className="flex shrink-0 items-stretch">
        {right.map((seg, i) => (
          <span key={seg.id} className="flex items-stretch">
            {!filled && config.separator === "bar" && i > 0 && (
              <span className="flex items-center opacity-50">│</span>
            )}
            <Sep
              from={seg.bg}
              to={right[i - 1]?.bg ?? c.statusBg}
              separator={config.separator}
              side="right"
            />
            <span
              className="flex items-center px-2 font-semibold"
              style={{ background: seg.bg, color: seg.fg }}
              title={MODULES[seg.id as keyof typeof MODULES]?.tmux}
            >
              {seg.sample}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
