import { useEffect, useRef, useState, useCallback } from 'react';
import type { SavedSession, SessionInput } from '../lib/types';
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

type UseAutoSaveOptions = {
  onSaveSuccess?: (savedSession: SavedSession) => void;
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

export function useAutoSave(
  session: SessionInput | null,
  enabled: boolean = true,
  options?: UseAutoSaveOptions
): UseAutoSaveReturn {
  // State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousSessionRef = useRef<string | null>(null);
  const onSaveSuccess = options?.onSaveSuccess;

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
        previousSessionRef.current = JSON.stringify(session);
        if (result.data) {
          onSaveSuccess?.(result.data);
        }
      } else {
        setSaveStatus('unsaved');
        setError(result.error || 'Failed to save session');
      }
    } catch (err) {
      setSaveStatus('unsaved');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, [session, onSaveSuccess]);

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
      void performSave();
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
