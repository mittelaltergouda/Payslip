"use client";

/**
 * Props for the UndoRedoControls component.
 */
export interface UndoRedoControlsProps {
  /**
   * Callback function to trigger undo operation.
   */
  onUndo: () => void;

  /**
   * Callback function to trigger redo operation.
   */
  onRedo: () => void;

  /**
   * Whether undo operation is available (history has past states).
   */
  canUndo: boolean;

  /**
   * Whether redo operation is available (history has future states).
   */
  canRedo: boolean;

  /**
   * Optional CSS class name for additional styling.
   */
  className?: string;
}

/**
 * UndoRedoControls component displays undo and redo buttons with proper
 * enabled/disabled states based on the history stack availability.
 *
 * The buttons are disabled when their respective operations are not available
 * (e.g., undo is disabled when there are no past states). Each button includes
 * aria-labels for accessibility.
 *
 * @example
 * ```tsx
 * const { undo, redo, canUndo, canRedo } = useSessionHistory(initialSession);
 *
 * <UndoRedoControls
 *   onUndo={undo}
 *   onRedo={redo}
 *   canUndo={canUndo}
 *   canRedo={canRedo}
 * />
 * ```
 */
export function UndoRedoControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className = "",
}: UndoRedoControlsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last change (Ctrl+Z or Cmd+Z)"
        className={`
          px-3 py-1.5 rounded text-sm font-medium
          transition-colors duration-150
          ${
            canUndo
              ? "bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        ↶ Undo
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo last undone change (Ctrl+Y or Cmd+Shift+Z)"
        className={`
          px-3 py-1.5 rounded text-sm font-medium
          transition-colors duration-150
          ${
            canRedo
              ? "bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        ↷ Redo
      </button>
    </div>
  );
}
