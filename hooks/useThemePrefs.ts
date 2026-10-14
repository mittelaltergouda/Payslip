"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_THEME_PREFS,
  KONAMI_SEQUENCE,
  THEME_STORAGE_KEY,
  advanceKonami,
  parseThemePrefs,
  serializeThemePrefs,
  type ThemeName,
  type ThemePrefs,
} from "@/lib/theme";

function readPrefs(): ThemePrefs {
  try {
    return parseThemePrefs(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_PREFS;
  }
}

function writePrefs(prefs: ThemePrefs): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, serializeThemePrefs(prefs));
  } catch {
    // Storage may be unavailable (private mode); the theme still applies for this visit.
  }
}

/**
 * Hidden-theme state: whether the Sinister theme is unlocked and which theme
 * is active. Applies the theme to <html data-theme> and listens for the
 * Konami code, which calls `onKonami` (e.g. to open the access terminal).
 */
export function useThemePrefs(onKonami?: () => void) {
  // null until browser storage was read, so the theme set by the boot script
  // in <head> is not reset before the stored preference is known.
  const [prefs, setPrefs] = useState<ThemePrefs | null>(null);
  const konamiProgress = useRef(0);

  // Read after hydration so server and first client render match.
  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  const theme = prefs?.theme;
  useEffect(() => {
    if (!theme) {
      return;
    }
    const root = document.documentElement;
    if (theme === "sinister") {
      root.dataset.theme = "sinister";
    } else {
      delete root.dataset.theme;
    }
  }, [theme]);

  useEffect(() => {
    if (!onKonami) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      konamiProgress.current = advanceKonami(konamiProgress.current, event.key);
      if (konamiProgress.current === KONAMI_SEQUENCE.length) {
        konamiProgress.current = 0;
        onKonami();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKonami]);

  const update = useCallback((next: ThemePrefs) => {
    setPrefs(next);
    writePrefs(next);
  }, []);

  const unlock = useCallback(() => update({ unlocked: true, theme: "sinister" }), [update]);
  const setTheme = useCallback(
    (theme: ThemeName) => update({ unlocked: true, theme }),
    [update]
  );

  /** Revokes the unlock: back to the default design, switch hidden again. */
  const lock = useCallback(() => update(DEFAULT_THEME_PREFS), [update]);

  const current = prefs ?? DEFAULT_THEME_PREFS;
  return { unlocked: current.unlocked, theme: current.theme, unlock, lock, setTheme };
}
