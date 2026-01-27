import { useEffect } from "react";

/**
 * Options for configuring keyboard shortcuts behavior.
 */
export interface UseKeyboardShortcutsOptions {
  /**
   * Callback function invoked when undo shortcut is triggered.
   * Typically Ctrl+Z (Windows/Linux) or Cmd+Z (Mac).
   */
  onUndo: () => void;

  /**
   * Callback function invoked when redo shortcut is triggered.
   * Typically Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac).
   */
  onRedo: () => void;

  /**
   * Whether the shortcuts are enabled.
   * @default true
   */
  enabled?: boolean;
}

/**
 * React hook that sets up keyboard shortcuts for undo/redo operations.
 *
 * This hook listens for keyboard events and triggers undo/redo callbacks
 * when the appropriate key combinations are pressed:
 * - Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
 * - Redo: Ctrl+Y or Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (Mac)
 *
 * The shortcuts are automatically disabled when the user is typing in an
 * input field, textarea, or contenteditable element to prevent interference
 * with normal text editing operations.
 *
 * @param options - Configuration options for the keyboard shortcuts
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { undo, redo } = useSessionHistory(initialSession);
 *
 *   useKeyboardShortcuts({
 *     onUndo: undo,
 *     onRedo: redo,
 *     enabled: true
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { onUndo, onRedo, enabled = true } = options;

  useEffect(() => {
    // Don't set up listeners if shortcuts are disabled
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputField) {
        return;
      }

      // Detect platform: Mac uses metaKey (Cmd), Windows/Linux use ctrlKey
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (Mac)
      else if (isCtrlOrCmd && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      }
    };

    // Attach event listener to window
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: remove event listener on unmount or when dependencies change
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onUndo, onRedo, enabled]);
}
