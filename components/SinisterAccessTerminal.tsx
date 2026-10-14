"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { isAccessCode } from "@/lib/theme";
import type { Lang } from "@/lib/i18n/translations";

// Banner from the source of the Sinister Incorporated website.
const BANNER = String.raw`  _________.__       .__          __
 /   _____/|__| ____ |__| _______/  |_  ___________
 \_____  \ |  |/    \|  |/  ___/\   __\/ __ \_  __ \
 /        \|  |   |  \  |\___ \  |  | \  ___/|  | \/
/_______  /|__|___|  /__/____  > |__|  \___  >__|
        \/         \/        \/            \/`;

const TEXT = {
  de: {
    title: "Sinister Terminal",
    description: "Gesicherter Zugang. Bitte Kennung eingeben.",
    descriptionActive: "Gesicherter Zugang.",
    prompt: "ZUGANGSKENNUNG",
    submit: "Bestätigen",
    denied: "ZUGRIFF VERWEIGERT",
    hint: "Nur wer dazugehört, kennt die Kennung.",
    granted: "ZUGANG GEWÄHRT. Willkommen bei Sinister Incorporated.",
    active: "ZUGANG AKTIV. Das Sinister-Design ist freigeschaltet.",
    lock: "Zugang entfernen",
  },
  en: {
    title: "Sinister terminal",
    description: "Secured access. Enter your identifier.",
    descriptionActive: "Secured access.",
    prompt: "ACCESS CODE",
    submit: "Confirm",
    denied: "ACCESS DENIED",
    hint: "Only those who belong know the code.",
    granted: "ACCESS GRANTED. Welcome to Sinister Incorporated.",
    active: "ACCESS ACTIVE. The Sinister design is unlocked.",
    lock: "Revoke access",
  },
} as const;

export const HINT_AFTER_ATTEMPTS = 3;
export const GRANTED_DELAY_MS = 1800;

export interface SinisterAccessTerminalProps {
  open: boolean;
  lang: Lang;
  /** Already unlocked: the terminal offers to revoke the access instead of asking for the code. */
  unlocked?: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: () => void;
  onLock?: () => void;
}

/** Hidden access prompt; the right code unlocks the Sinister theme, and an unlocked user can revoke it here. */
export function SinisterAccessTerminal({ open, lang, unlocked = false, onOpenChange, onUnlock, onLock }: SinisterAccessTerminalProps) {
  const t = TEXT[lang];
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"idle" | "denied" | "granted">("idle");
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    if (status !== "granted") {
      return;
    }
    const timer = setTimeout(() => {
      onUnlock();
      onOpenChange(false);
    }, GRANTED_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, onUnlock, onOpenChange]);

  const submit = async () => {
    if (status === "granted") {
      return;
    }
    if (await isAccessCode(code)) {
      setStatus("granted");
      return;
    }
    setAttempts((n) => n + 1);
    setStatus("denied");
    setShakeKey((n) => n + 1);
    setCode("");
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-red-700/50 bg-black font-mono text-red-100">
        <DialogTitle className="font-mono text-sm uppercase tracking-widest text-red-400">{t.title}</DialogTitle>
        <DialogDescription className="font-mono text-xs text-white/60">{unlocked && status !== "granted" ? t.descriptionActive : t.description}</DialogDescription>
        {unlocked && status !== "granted" ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-red-300">&gt; {t.active}</p>
            <button
              type="button"
              onClick={() => {
                onLock?.();
                onOpenChange(false);
              }}
              className="rounded-md border border-white/20 px-3 py-1 text-xs uppercase tracking-wider text-white/70 hover:bg-white/10"
            >
              {t.lock}
            </button>
          </div>
        ) : status === "granted" ? (
          <div role="status" className="space-y-3">
            <pre aria-hidden="true" className="overflow-x-auto whitespace-pre font-mono text-[10px] leading-[1.15] text-red-500">{BANNER}</pre>
            <p className="text-sm text-red-300">&gt; {t.granted}</p>
          </div>
        ) : (
          <form
            key={shakeKey}
            className={shakeKey > 0 ? "sinister-shake space-y-3" : "space-y-3"}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="flex items-center gap-2 text-sm text-red-300">
              <span aria-hidden="true">&gt;</span>
              <span className="sr-only">{t.prompt}</span>
              <span aria-hidden="true">{t.prompt}:</span>
              <input
                ref={inputRef}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="min-w-0 flex-1 border-b border-red-700/60 bg-transparent px-1 py-0.5 uppercase tracking-widest text-white caret-red-500 outline-none focus:border-red-400"
              />
            </label>
            {status === "denied" && <p role="alert" className="text-xs text-red-400">&gt; {t.denied}</p>}
            {attempts >= HINT_AFTER_ATTEMPTS && <p className="text-xs text-white/50">{t.hint}</p>}
            <button type="submit" className="rounded-md border border-red-700/60 px-3 py-1 text-xs uppercase tracking-wider text-red-200 hover:bg-red-900/40">
              {t.submit}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
