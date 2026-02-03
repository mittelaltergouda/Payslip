"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n/translations";

/**
 * Props for the ShareButton component
 */
type ShareButtonProps = {
  /**
   * Session ID to generate share link for
   */
  sessionId: string;
  /**
   * Current language for translations
   */
  lang: Lang;
  /**
   * Callback when share link is generated and copied successfully
   * @param shareUrl - The generated share URL
   */
  onShareSuccess?: (shareUrl: string) => void;
  /**
   * Callback when share generation or copy fails
   * @param error - Error message
   */
  onShareError?: (error: string) => void;
  /**
   * Optional CSS class name for custom styling
   */
  className?: string;
};

// Translation strings
const translations = {
  de: {
    shareButton: "Teilen",
    shareTooltip: "Share-Link erstellen und kopieren",
    generating: "Generiere...",
    copied: "Kopiert!",
  },
  en: {
    shareButton: "Share",
    shareTooltip: "Generate and copy share link",
    generating: "Generating...",
    copied: "Copied!",
  },
};

/**
 * ShareButton Component
 *
 * Generates a shareable read-only link for a session and copies it to clipboard.
 * - Calls POST /api/sessions/[id]/share to generate a secure token
 * - Copies the full share URL to clipboard with one click
 * - Shows loading state during generation
 * - Shows success feedback after copying
 *
 * Follows the glassmorphism design pattern from the existing codebase.
 *
 * @example
 * ```tsx
 * <ShareButton
 *   sessionId="abc123"
 *   lang="en"
 *   onShareSuccess={(url) => console.log(`Shared: ${url}`)}
 *   onShareError={(error) => console.error(error)}
 * />
 * ```
 */
export function ShareButton({
  sessionId,
  lang,
  onShareSuccess,
  onShareError,
  className = "",
}: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const t = translations[lang];

  /**
   * Handles the share button click.
   * Generates a share token and copies the URL to clipboard.
   */
  const handleShare = async () => {
    // Prevent multiple simultaneous requests
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setIsCopied(false);

    try {
      // Call the share API endpoint
      const response = await fetch(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate share link");
      }

      const data = await response.json();
      const shareUrl = data.shareUrl;

      // Build full URL for clipboard
      const fullUrl = `${window.location.origin}${shareUrl}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl);

      // Show success feedback
      setIsCopied(true);

      // Notify success
      if (onShareSuccess) {
        onShareSuccess(fullUrl);
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate share link";

      // Notify error
      if (onShareError) {
        onShareError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine button text based on state
  const buttonText = isGenerating
    ? t.generating
    : isCopied
      ? t.copied
      : t.shareButton;

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={isGenerating}
      className={`bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md px-4 py-2 text-white/90 hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={t.shareTooltip}
      aria-label={t.shareTooltip}
    >
      <span className="flex items-center gap-2">
        {/* Share icon */}
        {!isCopied && !isGenerating && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )}

        {/* Loading spinner */}
        {isGenerating && (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Checkmark icon */}
        {isCopied && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {buttonText}
      </span>
    </button>
  );
}
