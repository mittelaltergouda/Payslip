import { HistoryStack } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of history states to retain.
 * Prevents unbounded memory growth in long-running sessions.
 */
export const MAX_HISTORY_DEPTH = 50;

// ============================================================================
// HISTORY STACK OPERATIONS
// ============================================================================

/**
 * Creates a new history stack with an initial state.
 *
 * @param initialState - The starting state to use as the present
 * @returns A new HistoryStack with empty past and future
 */
export function createHistory<T>(initialState: T): HistoryStack<T> {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

/**
 * Pushes a new state onto the history stack.
 *
 * The current present state is moved to the past stack,
 * the new state becomes present, and the future stack is cleared
 * (since making a new change after undo invalidates redo).
 *
 * If the past stack exceeds MAX_HISTORY_DEPTH, the oldest state is dropped.
 *
 * @param stack - The current history stack
 * @param newState - The new state to push
 * @returns A new HistoryStack with updated state
 */
export function push<T>(stack: HistoryStack<T>, newState: T): HistoryStack<T> {
  // Deep clone the present state before adding to past
  const clonedPresent = structuredClone(stack.present);

  // Add current present to past, enforcing max depth
  let newPast = [...stack.past, clonedPresent];
  if (newPast.length > MAX_HISTORY_DEPTH) {
    // Drop the oldest state
    newPast = newPast.slice(1);
  }

  return {
    past: newPast,
    present: newState,
    future: [], // Clear redo history on new edit
  };
}

/**
 * Moves to the previous state in the history stack (undo operation).
 *
 * The current present is moved to the future stack,
 * and the last past state becomes the new present.
 *
 * If there is no past state, returns the stack unchanged.
 *
 * @param stack - The current history stack
 * @returns A new HistoryStack with the previous state as present
 */
export function undo<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.past.length === 0) {
    return stack;
  }

  const previous = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

/**
 * Moves to the next state in the history stack (redo operation).
 *
 * The current present is moved to the past stack,
 * and the first future state becomes the new present.
 *
 * If there is no future state, returns the stack unchanged.
 *
 * @param stack - The current history stack
 * @returns A new HistoryStack with the next state as present
 */
export function redo<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.future.length === 0) {
    return stack;
  }

  const next = stack.future[0];
  const newFuture = stack.future.slice(1);

  return {
    past: [...stack.past, stack.present],
    present: next,
    future: newFuture,
  };
}

/**
 * Checks if an undo operation is possible.
 *
 * @param stack - The current history stack
 * @returns True if there are past states available, false otherwise
 */
export function canUndo<T>(stack: HistoryStack<T>): boolean {
  return stack.past.length > 0;
}

/**
 * Checks if a redo operation is possible.
 *
 * @param stack - The current history stack
 * @returns True if there are future states available, false otherwise
 */
export function canRedo<T>(stack: HistoryStack<T>): boolean {
  return stack.future.length > 0;
}

/**
 * Gets the number of available undo operations.
 *
 * @param stack - The current history stack
 * @returns The number of states in the past stack
 */
export function getUndoCount<T>(stack: HistoryStack<T>): number {
  return stack.past.length;
}

/**
 * Gets the number of available redo operations.
 *
 * @param stack - The current history stack
 * @returns The number of states in the future stack
 */
export function getRedoCount<T>(stack: HistoryStack<T>): number {
  return stack.future.length;
}

/**
 * Clears the entire history stack, keeping only the current present state.
 *
 * Useful when switching to a different session or resetting history.
 *
 * @param stack - The current history stack
 * @returns A new HistoryStack with empty past and future
 */
export function clearHistory<T>(stack: HistoryStack<T>): HistoryStack<T> {
  return {
    past: [],
    present: stack.present,
    future: [],
  };
}
