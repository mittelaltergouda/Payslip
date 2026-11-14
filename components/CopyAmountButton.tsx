"use client";

import { useEffect, useState } from "react";
import { formatPlainAmount } from "@/lib/format";

type Props = {
  amount: number;
  /** Accessible name, e.g. "Amount kopieren Player 1 → Player 2". */
  label: string;
  copiedLabel: string;
};

/** Copies text, falling back to a hidden textarea where the Clipboard API is unavailable. */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy path (e.g. permission denied).
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  if (!ok) {
    throw new Error("Copy failed");
  }
}

/** Copies a transfer amount as plain digits, ready to paste into the in-game wallet. */
export function CopyAmountButton({ amount, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {return;}
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleClick = async () => {
    try {
      await copyText(formatPlainAmount(amount));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-border-focus"
    >
      {copied ? (
        <span aria-live="polite">✓ {copiedLabel}</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15V6a2 2 0 012-2h9" />
        </svg>
      )}
    </button>
  );
}
