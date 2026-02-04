"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SessionList } from "@/components/SessionList";
import type { SessionListItemData } from "@/components/SessionListItem";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Lang } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";

/**
 * Sessions page displays a list of all saved sessions with filtering and search.
 *
 * Features:
 * - Fetches sessions from the API
 * - Displays sessions with name, type, date, revenue, and member count
 * - Supports filtering by session type
 * - Supports search by session name
 * - Allows navigation to individual sessions
 */
export default function SessionsPage() {
  const [lang, setLang] = useState<Lang>("de");
  const t = translations[lang];

  const [sessions, setSessions] = useState<SessionListItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions from API
  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/sessions");

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }

        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchSessions();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-block mb-4 text-neon hover:underline">
              ← {t.appName}
            </Link>
            <h1 className="text-4xl font-bold text-neon">{t.sessionHistory}</h1>
          </div>
          <LanguageSwitcher lang={lang} onLangChange={setLang} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="glass p-8 text-center">
          <p className="text-white/60 text-lg">Loading sessions...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="glass p-8 border-l-4 border-red-500">
          <p className="text-red-400 text-lg">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Session list */}
      {!isLoading && !error && (
        <SessionList
          sessions={sessions}
          lang={lang}
          translations={{
            members: t.members,
            revenueLabel: t.revenueLabel,
            searchPlaceholder: lang === "de" ? "Sessions durchsuchen..." : "Search sessions...",
            filterByType: lang === "de" ? "Nach Typ filtern" : "Filter by type",
            allTypes: lang === "de" ? "Alle Typen" : "All Types",
            noSessions: t.noSessions,
            noSessionsFound: lang === "de" ? "Keine Sessions gefunden" : "No sessions found matching your filters",
          }}
        />
      )}
    </main>
  );
}
