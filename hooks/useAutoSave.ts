import { useEffect, useRef, useState, useCallback } from 'react';
import type { SessionInput } from '../lib/types';
import { save } from '../lib/storage/sessionStorage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Save status indicator
 */
export type SaveStatus = 'saved' | 'saving' | 'unsaved';

/**
 * Return type for useAutoSave hook
 */
export type UseAutoSaveReturn = {
  saveStatus: SaveStatus;
  manualSave: () => Promise<void>;
  error: string | null;
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Debounce delay in milliseconds (1 second)
 */
const DEBOUNCE_DELAY_MS = 1000;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Auto-save hook with 1-second debouncing for session data.
 *
 * Automatically saves session changes to localStorage after a 1-second delay
 * to prevent excessive writes during rapid input. Tracks save status and
 * provides manual save capability.
 *
 * @param session - The session data to auto-save
 * @param enabled - Whether auto-save is enabled (default: true)
 * @returns Object containing saveStatus, manualSave function, and error state
 *
 * @example
 * ```tsx
 * const { saveStatus, manualSave, error } = useAutoSave(sessionData);
 *
 * // Show save status indicator
 * <SaveStatusIndicator status={saveStatus} />
 *
 * // Manual save on Ctrl+S
 * useEffect(() => {
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if (e.ctrlKey && e.key === 's') {
 *       e.preventDefault();
 *       manualSave();
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, [manualSave]);
 * ```
 */
export function useAutoSave(
  session: SessionInput | null,
  enabled: boolean = true
): UseAutoSaveReturn {
  // State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousSessionRef = useRef<string | null>(null);

  /**
   * Performs the actual save operation
   */
  const performSave = useCallback(async () => {
    if (!session) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      const result = save(session);

      if (result.success) {
        setSaveStatus('saved');
        // Update previous session reference
        previousSessionRef.current = JSON.stringify(session);
      } else {
        setSaveStatus('unsaved');
        setError(result.error || 'Failed to save session');
      }
    } catch (err) {
      setSaveStatus('unsaved');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, [session]);

  /**
   * Manual save function (can be called directly, e.g., on Ctrl+S)
   */
  const manualSave = useCallback(async () => {
    // Cancel any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await performSave();
  }, [performSave]);

  // Auto-save effect with debouncing
  useEffect(() => {
    // Skip if auto-save is disabled or no session
    if (!enabled || !session) {
      return;
    }

    // Serialize session for comparison
    const currentSessionStr = JSON.stringify(session);

    // Check if session has changed
    if (previousSessionRef.current === currentSessionStr) {
      // No changes, keep status as 'saved'
      return;
    }

    // Session has changed, mark as unsaved
    setSaveStatus('unsaved');

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounced save
    debounceTimerRef.current = setTimeout(() => {
      performSave();
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY_MS);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [session, enabled, performSave]);

  return {
    saveStatus,
    manualSave,
    error,
  };
}
