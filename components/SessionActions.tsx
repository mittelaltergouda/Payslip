"use client";

import { useRef } from "react";
import { exportAll, importAll } from "@/lib/storage/sessionStorage";
import { Lang } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";

/**
 * Props for the SessionActions component
 */
type SessionActionsProps = {
  /**
   * Current language for translations
   */
  lang: Lang;
  /**
   * Callback when export succeeds
   */
  onExportSuccess?: () => void;
  /**
   * Callback when export fails
   * @param error - Error message
   */
  onExportError?: (error: string) => void;
  /**
   * Callback when import succeeds
   * @param count - Number of sessions imported
   */
  onImportSuccess?: (count: number) => void;
  /**
   * Callback when import fails
   * @param error - Error message
   */
  onImportError?: (error: string) => void;
  /**
   * Callback when sessions are imported (for updating UI)
   */
  onSessionsImported?: () => void;
};

/**
 * SessionActions Component
 *
 * Provides export and import functionality for session data.
 * - Export: Downloads all sessions as a JSON file with timestamp
 * - Import: Uploads a JSON file and merges sessions without duplicates
 *
 * Follows the glassmorphism design pattern from the existing codebase.
 *
 * @example
 * ```tsx
 * <SessionActions
 *   lang="en"
 *   onExportSuccess={() => console.log("Exported")}
 *   onImportSuccess={(count) => console.log(`Imported ${count} sessions`)}
 *   onImportError={(error) => console.error(error)}
 *   onSessionsImported={() => refreshSessionList()}
 * />
 * ```
 */
export function SessionActions({
  lang,
  onExportSuccess,
  onExportError,
  onImportSuccess,
  onImportError,
  onSessionsImported,
}: SessionActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Translation strings
  const translations = {
    de: {
      exportAll: "Exportieren",
      importSessions: "Importieren",
      exportTooltip: "Alle Sessions als JSON herunterladen",
      importTooltip: "Sessions aus JSON-Datei importieren",
    },
    en: {
      exportAll: "Export All",
      importSessions: "Import",
      exportTooltip: "Download all sessions as JSON",
      importTooltip: "Import sessions from JSON file",
    },
  };

  const t = translations[lang];

  /**
   * Handles the export action.
   * Creates a downloadable JSON file with all sessions.
   */
  const handleExport = () => {
    try {
      // Get all sessions as JSON
      const jsonData = exportAll();

      // Create a blob with the JSON data
      const blob = new Blob([jsonData], { type: "application/json" });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
      link.download = `sc-payslip-sessions-${timestamp}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Notify success
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed";
      if (onExportError) {
        onExportError(errorMessage);
      }
    }
  };

  /**
   * Handles the import action.
   * Opens a file picker to select a JSON file for import.
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles the file selection for import.
   * Reads the file, validates it, and imports sessions.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      // Read file content
      const fileContent = await file.text();

      // Import sessions
      const result = importAll(fileContent);

      if (result.success && result.data) {
        // Notify success
        if (onImportSuccess) {
          onImportSuccess(result.data.count);
        }
        // Trigger UI update
        if (onSessionsImported) {
          onSessionsImported();
        }
      } else {
        // Notify error
        if (onImportError) {
          onImportError(result.error || "Import failed");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to read file";
      if (onImportError) {
        onImportError(errorMessage);
      }
    } finally {
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Export Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleExport}
        title={t.exportTooltip}
        aria-label={t.exportTooltip}
      >
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {t.exportAll}
      </Button>

      {/* Import Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImportClick}
        title={t.importTooltip}
        aria-label={t.importTooltip}
      >
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {t.importSessions}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
