"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const acknowledgementKey = "sc-payslip-storage-notice-acknowledged";

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(window.sessionStorage.getItem(acknowledgementKey) !== "true");
    } catch {
      setIsVisible(true);
    }
  }, []);

  function acknowledgeNotice() {
    try {
      window.sessionStorage.setItem(acknowledgementKey, "true");
    } catch {
      // The notice can still be dismissed when browser storage is unavailable.
    }
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Cookie-Hinweis"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-neon/40 bg-night/95 p-4 shadow-2xl shadow-black/40 backdrop-blur md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-white/80">
          <p className="font-semibold text-white">Lokale Speicherung</p>
          <p>
            SC Payslip setzt keine Cookies. Deine Payslip-Daten werden ausschließlich lokal in deinem Browser
            gespeichert. Tracking findet nicht statt. Mehr unter{" "}
            <Link className="font-semibold text-neon underline-offset-4 hover:underline" href="/datenschutz">
              Datenschutz
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={acknowledgeNotice}
          className="shrink-0 rounded-full bg-neon px-5 py-2 text-sm font-semibold text-night transition hover:bg-neon/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          Verstanden
        </button>
      </div>
    </aside>
  );
}
