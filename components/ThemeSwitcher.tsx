"use client";

import type { ThemeName } from "@/lib/theme";

export interface ThemeSwitcherProps {
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  label: string;
  defaultLabel: string;
}

/** Standard | Sinister radio switch; only rendered once the Sinister theme is unlocked. */
export function ThemeSwitcher({ theme, onThemeChange, label, defaultLabel }: ThemeSwitcherProps) {
  const options: Array<{ value: ThemeName; text: string }> = [
    { value: "default", text: defaultLabel },
    { value: "sinister", text: "Sinister" },
  ];
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
      {options.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-border-focus ${
            theme === option.value ? "bg-neon text-night font-semibold" : "text-white/70 hover:bg-white/10"
          }`}
        >
          <input
            type="radio"
            name="app-theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => onThemeChange(option.value)}
            className="sr-only"
          />
          {option.text}
        </label>
      ))}
    </div>
  );
}
