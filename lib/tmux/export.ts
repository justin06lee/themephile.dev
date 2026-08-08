import {
  buildSegments,
  isFilled,
  SEPARATORS,
  type Segment,
  type TmuxConfig,
} from "./config";

/**
 * Build a `status-left` / `status-right` value. The preview component walks the
 * same segment list, so what you see is what tmux draws.
 */
export function statusString(
  config: TmuxConfig,
  side: "left" | "right",
  /** Use each module's sample text instead of its tmux format. */
  sample = false,
): string {
  const { colors, separator } = config;
  const filled = isFilled(separator);
  const glyph = side === "left" ? SEPARATORS[separator].left : SEPARATORS[separator].right;
  const ids = side === "left" ? config.left : config.right;
  const segments = buildSegments(ids, colors, side, filled);
  if (!segments.length) return "";

  const text = (s: Segment) => (sample ? s.sample : s.tmux);
  const out: string[] = [];

  if (side === "left") {
    segments.forEach((seg, i) => {
      out.push(`#[fg=${seg.fg},bg=${seg.bg},bold] ${text(seg)} `);
      const nextBg = segments[i + 1]?.bg ?? colors.statusBg;
      if (filled && glyph) {
        // Same color on both sides means the divider would be invisible anyway.
        if (seg.bg !== nextBg) {
          out.push(`#[fg=${seg.bg},bg=${nextBg},nobold,nounderscore,noitalics]${glyph}`);
        }
      } else if (i < segments.length - 1 && glyph) {
        out.push(`#[fg=${colors.statusFg},bg=${colors.statusBg},nobold]${glyph}`);
      }
    });
  } else {
    segments.forEach((seg, i) => {
      const prevBg = segments[i - 1]?.bg ?? colors.statusBg;
      if (filled && glyph) {
        if (seg.bg !== prevBg) {
          out.push(`#[fg=${seg.bg},bg=${prevBg},nobold,nounderscore,noitalics]${glyph}`);
        }
      } else if (i > 0 && glyph) {
        out.push(`#[fg=${colors.statusFg},bg=${colors.statusBg},nobold]${glyph}`);
      }
      out.push(`#[fg=${seg.fg},bg=${seg.bg},bold] ${text(seg)} `);
    });
  }

  return out.join("");
}

function windowFormats(config: TmuxConfig) {
  const { colors, separator } = config;
  const filled = isFilled(separator);
  const { left: leftGlyph, right: rightGlyph } = SEPARATORS[separator];
  const label = config.showWindowIndex ? "#I:#W" : "#W";
  const zoom = config.showZoomFlag ? "#{?window_zoomed_flag, [Z],}" : "";

  if (filled && leftGlyph) {
    // The active window is an island mid-bar, so it needs a pointed cap on
    // each end: the mirrored glyph opening it, the normal one closing it.
    return {
      current:
        `#[fg=${colors.activeWindowBg},bg=${colors.statusBg}]${rightGlyph}` +
        `#[fg=${colors.activeWindowFg},bg=${colors.activeWindowBg},bold] ${label}${zoom} ` +
        `#[fg=${colors.activeWindowBg},bg=${colors.statusBg},nobold]${leftGlyph}`,
      normal: `#[fg=${colors.windowFg},bg=${colors.statusBg}] ${label}${zoom} `,
    };
  }
  return {
    current: `#[fg=${colors.activeWindowBg},bg=${colors.statusBg},bold] ${label}${zoom} `,
    normal: `#[fg=${colors.windowFg},bg=${colors.statusBg}] ${label}${zoom} `,
  };
}

export function generateTmuxConf(config: TmuxConfig, themeName: string): string {
  const c = config.colors;
  const formats = windowFormats(config);
  const sepNote = SEPARATORS[config.separator].nerdFont
    ? "\n# Separators use Powerline glyphs — set your terminal to a Nerd Font."
    : "";

  const lines: string[] = [
    `# ${themeName} — tmux config generated with themephile.dev`,
    `# Written for tmux 3.0+.${sepNote}`,
    "",
    "# ─── terminal ───────────────────────────────────────────────────────────",
    'set -g default-terminal "tmux-256color"',
  ];

  if (config.trueColor) {
    lines.push(
      'set -ag terminal-overrides ",*256col*:RGB"',
      'set -ag terminal-overrides ",xterm-kitty:RGB"',
    );
  }

  lines.push(
    "",
    "# ─── behaviour ──────────────────────────────────────────────────────────",
  );

  if (config.prefix !== "C-b") {
    lines.push(
      "unbind C-b",
      `set -g prefix ${config.prefix}`,
      `bind ${config.prefix} send-prefix`,
    );
  }

  lines.push(
    `set -g mouse ${config.mouse ? "on" : "off"}`,
    `set -g base-index ${config.baseIndex}`,
    `setw -g pane-base-index ${config.baseIndex}`,
    `set -g renumber-windows ${config.renumberWindows ? "on" : "off"}`,
    `set -sg escape-time ${config.escapeTime}`,
    `set -g history-limit ${config.historyLimit}`,
    `set -g focus-events ${config.focusEvents ? "on" : "off"}`,
    "set -g set-clipboard on",
    "setw -g aggressive-resize on",
  );

  if (config.vimKeys) {
    lines.push(
      "",
      "# vi-style copy mode and pane movement",
      "setw -g mode-keys vi",
      'bind -T copy-mode-vi v send -X begin-selection',
      'bind -T copy-mode-vi y send -X copy-selection-and-cancel',
      "bind h select-pane -L",
      "bind j select-pane -D",
      "bind k select-pane -U",
      "bind l select-pane -R",
      "bind -r H resize-pane -L 5",
      "bind -r J resize-pane -D 5",
      "bind -r K resize-pane -U 5",
      "bind -r L resize-pane -R 5",
    );
  }

  if (config.intuitiveSplits) {
    lines.push(
      "",
      "# splits that keep the current directory, on keys you can see",
      "unbind %",
      "unbind '\"'",
      'bind | split-window -h -c "#{pane_current_path}"',
      'bind - split-window -v -c "#{pane_current_path}"',
      'bind c new-window -c "#{pane_current_path}"',
    );
  }

  lines.push(
    "",
    'bind r source-file ~/.tmux.conf \\; display-message "tmux.conf reloaded"',
    "",
    "# ─── status bar ─────────────────────────────────────────────────────────",
    "set -g status on",
    `set -g status-position ${config.statusPosition}`,
    `set -g status-interval ${config.statusInterval}`,
    `set -g status-justify ${config.justify}`,
    `set -g status-style "bg=${c.statusBg},fg=${c.statusFg}"`,
    "set -g status-left-length 100",
    "set -g status-right-length 100",
    `set -g status-left "${statusString(config, "left")}"`,
    `set -g status-right "${statusString(config, "right")}"`,
    "",
    `setw -g window-status-format "${formats.normal}"`,
    `setw -g window-status-current-format "${formats.current}"`,
    'setw -g window-status-separator ""',
    `setw -g window-status-activity-style "fg=${c.messageBg},bg=${c.statusBg}"`,
    "",
    "# ─── panes & messages ───────────────────────────────────────────────────",
    `set -g pane-border-style "fg=${c.paneBorder}"`,
    `set -g pane-active-border-style "fg=${c.paneActiveBorder}"`,
    `set -g pane-border-lines ${config.paneBorderLines}`,
    "set -g pane-border-status off",
    `set -g message-style "bg=${c.messageBg},fg=${c.messageFg}"`,
    `set -g message-command-style "bg=${c.messageBg},fg=${c.messageFg}"`,
    `set -g mode-style "bg=${c.accentBg},fg=${c.accentFg}"`,
    `setw -g clock-mode-colour "${c.accentBg}"`,
    `set -g display-panes-active-colour "${c.paneActiveBorder}"`,
    `set -g display-panes-colour "${c.paneBorder}"`,
    "",
  );

  return lines.join("\n");
}
