"use client";

import { useEffect, useRef, useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  primary = false,
  className = "",
}: {
  value: string;
  label?: string;
  primary?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      onClick={copy}
      className={`btn text-xs ${primary ? "btn-primary" : ""} ${className}`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          Copied
        </>
      ) : (
        label
      )}
    </button>
  );
}
