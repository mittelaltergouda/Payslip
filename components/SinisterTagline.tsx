"use client";

import { useEffect, useState } from "react";
import { SINISTER_TAGLINE_WORDS } from "@/lib/theme";
import type { Lang } from "@/lib/i18n/translations";

export const TAGLINE_INTERVAL_MS = 2600;

/** "Gewinnverteilung für Piraterie / Schmuggel / …", after the rotating headline of the website. */
export function SinisterTagline({ lang }: { lang: Lang }) {
  const words = SINISTER_TAGLINE_WORDS[lang];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), TAGLINE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <p className="text-white/70 max-w-2xl text-sm sinister-mono">
      {lang === "de" ? "Gewinnverteilung für " : "Profit split for "}
      <span key={index} className="sinister-word font-semibold text-neon">{words[index % words.length]}</span>
    </p>
  );
}
