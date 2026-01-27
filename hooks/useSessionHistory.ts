import { useCallback, useState } from "react";
import { SessionInput, HistoryStack } from "@/lib/types";
import {
  createHistory,
  push,
  undo as undoHistory,
  redo as redoHistory,
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
} from "@/lib/history";

/**
 * React hook for managing session state with undo/redo functionality.
 *
 * This hook wraps a SessionInput state with a history stack, enabling
 * users to undo and redo changes to the session. It maintains a stack
 * of past states and future states (for redo after undo).
 *
 * @param initialSession - The initial session state to start with
 * @returns An object containing:
 *   - session: The current session state
 *   - updateSession: Function to update the session (pushes to history)
 *   - undo: Function to revert to the previous state
 *   - redo: Function to reapply an undone change
 *   - canUndo: Boolean indicating if undo is available
 *   - canRedo: Boolean indicating if redo is available
 *
 * @example
 * ```tsx
 * const {
 *   session,
 *   updateSession,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo
 * } = useSessionHistory(initialSession);
 *
 * // Update session state (adds to history)
 * updateSession({ ...session, name: "New Name" });
 *
 * // Undo the change
 * if (canUndo) undo();
 *
 * // Redo the change
 * if (canRedo) redo();
 * ```
 */
export function useSessionHistory(initialSession: SessionInput) {
  // Initialize history stack with the initial session
  const [history, setHistory] = useState<HistoryStack<SessionInput>>(() =>
    createHistory(initialSession)
  );

  /**
   * Updates the session state and pushes it to the history stack.
   * This clears the redo stack (future states) as making a new change
   * after an undo invalidates the ability to redo.
   */
  const updateSession = useCallback((newSession: SessionInput) => {
    setHistory((h) => push(h, newSession));
  }, []);

  /**
   * Reverts to the previous session state.
   * Moves the current state to the future stack (for redo).
   * No-op if there are no past states.
   */
  const undo = useCallback(() => {
    setHistory((h) => undoHistory(h));
  }, []);

  /**
   * Reapplies a previously undone change.
   * Moves the next future state to the present.
   * No-op if there are no future states.
   */
  const redo = useCallback(() => {
    setHistory((h) => redoHistory(h));
  }, []);

  return {
    session: history.present,
    updateSession,
    undo,
    redo,
    canUndo: checkCanUndo(history),
    canRedo: checkCanRedo(history),
  };
}
