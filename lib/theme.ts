// ============================================================================
// HIDDEN SINISTER THEME
// ============================================================================
// The Sinister Incorporated look is an easter egg: it unlocks with the org's
// access code and then stays available through a theme switch. Everything is
// kept in browser storage only.

import { z } from "zod";

export type ThemeName = "default" | "sinister";

export const THEME_STORAGE_KEY = "sc-payslip-theme";

const themePrefsSchema = z.object({
  unlocked: z.boolean(),
  theme: z.enum(["default", "sinister"]),
});

export type ThemePrefs = z.infer<typeof themePrefsSchema>;

export const DEFAULT_THEME_PREFS: ThemePrefs = { unlocked: false, theme: "default" };

/**
 * SHA-256 of the normalised access code. Only the hash ships in the bundle, so
 * the code is not readable in plain text. (It is a playful lock, not security.)
 */
const ACCESS_CODE_SHA256 = "5bd551144512a33ae6e87b8e1746ef424a93e2f998eebfc9f128da998f5ad4a6";

/** Upper case without surrounding or inner whitespace: " s1 nister " → "S1NISTER". */
export function normalizeAccessCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Whether the entered text is the access code. */
export async function isAccessCode(input: string): Promise<boolean> {
  const normalized = normalizeAccessCode(input);
  if (!normalized) {
    return false;
  }
  return (await sha256Hex(normalized)) === ACCESS_CODE_SHA256;
}

/** Reads the stored preferences; anything missing or malformed falls back to locked/default. */
export function parseThemePrefs(raw: string | null): ThemePrefs {
  if (!raw) {
    return DEFAULT_THEME_PREFS;
  }
  try {
    const parsed = themePrefsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return DEFAULT_THEME_PREFS;
    }
    // The Sinister theme is only usable once unlocked.
    return parsed.data.unlocked ? parsed.data : DEFAULT_THEME_PREFS;
  } catch {
    return DEFAULT_THEME_PREFS;
  }
}

export function serializeThemePrefs(prefs: ThemePrefs): string {
  return JSON.stringify(themePrefsSchema.parse(prefs));
}

/** The classic Konami code; opens the access terminal on a keyboard. */
export const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
] as const;

/**
 * Progress through the Konami code after one more key. Returns the new
 * progress; equal to the sequence length means the code was completed.
 */
export function advanceKonami(progress: number, key: string): number {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  if (normalized === KONAMI_SEQUENCE[progress]) {
    return progress + 1;
  }
  // A wrong key may already be the start of a new attempt.
  return normalized === KONAMI_SEQUENCE[0] ? 1 : 0;
}

/** Taps on the app title within this window count towards opening the terminal. */
export const TITLE_TAPS_REQUIRED = 5;
export const TITLE_TAP_WINDOW_MS = 2000;

/**
 * Registers a tap on the app title. Returns the taps still inside the time
 * window and whether enough of them happened to open the terminal.
 */
export function registerTitleTap(taps: number[], now: number): { taps: number[]; open: boolean } {
  const recent = [...taps.filter((t) => now - t < TITLE_TAP_WINDOW_MS), now];
  if (recent.length >= TITLE_TAPS_REQUIRED) {
    return { taps: [], open: true };
  }
  return { taps: recent, open: false };
}

/** Words of the rotating tagline on the Sinister website. */
export const SINISTER_TAGLINE_WORDS = {
  de: ["Piraterie", "Privates Militär", "Auftragsunfälle", "Schmuggel", "\"Müllentsorgung\"", "Sicherheitsdienst", "Konkurrenzmanagement", "Gruppentherapie"],
  en: ["Piracy", "Private military", "Contract accidents", "Smuggling", "\"Waste disposal\"", "Security services", "Competition management", "Group therapy"],
} as const;

/**
 * Inline script for <head>: applies a stored Sinister theme before the first
 * paint, so unlocked users see no flash of the default design. Mirrors
 * parseThemePrefs; anything unexpected keeps the default theme.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"null");if(p&&p.unlocked===true&&p.theme==="sinister"){document.documentElement.dataset.theme="sinister";}}catch(e){}})();`;
