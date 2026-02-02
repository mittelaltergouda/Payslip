"use client";

import { useEffect, useRef, useState } from "react";
import { SavedSession } from "@/lib/types";
import { Lang } from "@/lib/i18n/translations";

/**
 * Props for the SessionHistory component.
 */
export interface SessionHistoryProps {
  /**
   * Whether the sidebar is currently open.
   */
  isOpen: boolean;

  /**
   * Callback function called when the sidebar should be closed.
   */
  onClose: () => void;

  /**
   * Array of saved sessions to display.
   */
  sessions: SavedSession[];

  /**
   * Callback function called when the user clicks the Load button.
   * Receives the selected session as a parameter.
   */
  onLoad: (session: SavedSession) => void;

  /**
   * Callback function called when the user confirms deletion of a session.
   * Receives the session ID as a parameter.
   */
  onDelete: (sessionId: string) => void;

  /**
   * Current language for date formatting.
   */
  lang: Lang;

  /**
   * Translation strings for the component.
   */
  translations: {
    sessionHistory: string;
    noSessions: string;
    loadSession: string;
    deleteSession: string;
    confirmDelete: string;
    cancel: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * SessionHistory component displays a sidebar overlay with a list of saved sessions.
 * Users can load or delete sessions. The sidebar can be closed by clicking outside
 * or pressing the Escape key.
 *
 * @example
 * ```tsx
 * <SessionHistory
 *   isOpen={isHistoryOpen}
 *   onClose={() => setIsHistoryOpen(false)}
 *   sessions={savedSessions}
 *   onLoad={handleLoadSession}
 *   onDelete={handleDeleteSession}
 *   lang="en"
 *   translations={t}
 * />
 * ```
 */
export function SessionHistory({
  isOpen,
  onClose,
  sessions,
  onLoad,
  onDelete,
  lang,
  translations,
}: SessionHistoryProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle Escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setDeleteConfirmId(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
        setDeleteConfirmId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = lang === "de" ? "de-DE" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle delete button click
  const handleDeleteClick = (sessionId: string) => {
    setDeleteConfirmId(sessionId);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (sessionId: string) => {
    onDelete(sessionId);
    setDeleteConfirmId(null);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-night/95 border-l border-white/10 backdrop-blur-xl z-50 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neon">
              {translations.sessionHistory}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition text-sand"
              aria-label="Close sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="glass p-6 text-center">
              <p className="text-white/60">{translations.noSessions}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((savedSession) => (
                <div key={savedSession.id} className="glass p-4 space-y-3">
                  {/* Session Info */}
                  <div>
                    <h3 className="font-semibold text-sand text-lg">
                      {savedSession.session.name}
                    </h3>
                    <div className="text-xs text-white/60 mt-1 space-y-0.5">
                      <p>
                        {translations.createdAt}: {formatDate(savedSession.createdAt)}
                      </p>
                      <p>
                        {translations.updatedAt}: {formatDate(savedSession.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {deleteConfirmId === savedSession.id ? (
                    <div className="space-y-2">
                      <p className="text-sm text-white/80">
                        {translations.confirmDelete}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteConfirm(savedSession.id)}
                          className="btn flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        >
                          {translations.deleteSession}
                        </button>
                        <button
                          onClick={handleDeleteCancel}
                          className="btn flex-1"
                        >
                          {translations.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoad(savedSession)}
                        className="btn flex-1 bg-neon/20 hover:bg-neon/30 text-neon border border-neon/50"
                      >
                        {translations.loadSession}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(savedSession.id)}
                        className="btn bg-white/10 hover:bg-white/20 text-white/80"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
