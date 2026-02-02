"use client";

import { Lang } from "@/lib/i18n/translations";

/**
 * Props for the LanguageSwitcher component.
 */
export interface LanguageSwitcherProps {
  /**
   * The currently selected language ("de" or "en").
   */
  lang: Lang;

  /**
   * Callback function called when the user selects a different language.
   * Receives the new language code as a parameter.
   */
  onLangChange: (lang: Lang) => void;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * LanguageSwitcher component provides language selection buttons for switching
 * between German (DE) and English (EN) languages in the application.
 *
 * The component displays two buttons (DE and EN) with visual feedback showing
 * which language is currently active. The active language button is highlighted
 * with a neon background, while the inactive button has a semi-transparent white
 * background.
 *
 * @example
 * ```tsx
 * const [lang, setLang] = useState<Lang>("en");
 *
 * <LanguageSwitcher
 *   lang={lang}
 *   onLangChange={setLang}
 * />
 * ```
 */
export function LanguageSwitcher({
  lang,
  onLangChange,
  className = "",
}: LanguageSwitcherProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        className={`px-3 py-2 rounded-lg ${
          lang === "de" ? "bg-neon text-night" : "bg-white/10"
        }`}
        onClick={() => onLangChange("de")}
        aria-label="Switch to German"
        aria-pressed={lang === "de"}
      >
        DE
      </button>
      <button
        className={`px-3 py-2 rounded-lg ${
          lang === "en" ? "bg-neon text-night" : "bg-white/10"
        }`}
        onClick={() => onLangChange("en")}
        aria-label="Switch to English"
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
