import {
  createHistory,
  push,
  undo,
  redo,
  canUndo,
  canRedo,
  getUndoCount,
  getRedoCount,
  clearHistory,
  MAX_HISTORY_DEPTH,
} from './history';
import { HistoryStack } from './types';

// ============================================================================
// TEST SUITE: createHistory
// ============================================================================

describe('createHistory', () => {
  it('should create a new history stack with an initial state', () => {
    const initialState = { value: 42 };
    const stack = createHistory(initialState);

    expect(stack.present).toEqual({ value: 42 });
    expect(stack.past).toEqual([]);
    expect(stack.future).toEqual([]);
  });

  it('should handle primitive types as initial state', () => {
    const numberStack = createHistory(5);
    expect(numberStack.present).toBe(5);
    expect(numberStack.past).toEqual([]);
    expect(numberStack.future).toEqual([]);

    const stringStack = createHistory('hello');
    expect(stringStack.present).toBe('hello');
    expect(stringStack.past).toEqual([]);
    expect(stringStack.future).toEqual([]);
  });

  it('should handle complex objects as initial state', () => {
    const complexState = {
      name: 'Test Session',
      members: [
        { id: '1', handle: 'Alice', active: true },
        { id: '2', handle: 'Bob', active: false },
      ],
      revenue: 1000,
    };

    const stack = createHistory(complexState);
    expect(stack.present).toEqual(complexState);
    expect(stack.past).toEqual([]);
    expect(stack.future).toEqual([]);
  });

  it('should handle null and undefined as initial state', () => {
    const nullStack = createHistory(null);
    expect(nullStack.present).toBeNull();

    const undefinedStack = createHistory(undefined);
    expect(undefinedStack.present).toBeUndefined();
  });
});

// ============================================================================
// TEST SUITE: push
// ============================================================================

describe('push', () => {
  it('should push a new state and move present to past', () => {
    const stack = createHistory({ value: 1 });
    const newStack = push(stack, { value: 2 });

    expect(newStack.present).toEqual({ value: 2 });
    expect(newStack.past).toEqual([{ value: 1 }]);
    expect(newStack.future).toEqual([]);
  });

  it('should clear future stack when pushing after undo', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    // Undo twice
    stack = undo(stack);
    stack = undo(stack);

    // Now future should have [2, 3]
    expect(stack.future).toEqual([{ value: 2 }, { value: 3 }]);

    // Push new state - should clear future
    stack = push(stack, { value: 4 });

    expect(stack.present).toEqual({ value: 4 });
    expect(stack.past).toEqual([{ value: 1 }]);
    expect(stack.future).toEqual([]);
  });

  it('should deep clone the present state before adding to past', () => {
    const state1 = { value: 1, nested: { data: 'original' } };
    const stack = createHistory(state1);

    const state2 = { value: 2, nested: { data: 'modified' } };
    const newStack = push(stack, state2);

    // Modify the original state1 object
    state1.nested.data = 'changed';

    // The past state should not be affected (deep clone worked)
    expect(newStack.past[0].nested.data).toBe('original');
  });

  it('should enforce MAX_HISTORY_DEPTH by dropping oldest state', () => {
    let stack = createHistory({ value: 0 });

    // Push MAX_HISTORY_DEPTH + 1 states
    for (let i = 1; i <= MAX_HISTORY_DEPTH + 1; i++) {
      stack = push(stack, { value: i });
    }

    // Past should have exactly MAX_HISTORY_DEPTH states
    expect(stack.past.length).toBe(MAX_HISTORY_DEPTH);

    // The oldest state (value: 0) should be dropped
    // The past should now start with value: 1
    expect(stack.past[0]).toEqual({ value: 1 });

    // The most recent state should be present
    expect(stack.present).toEqual({ value: MAX_HISTORY_DEPTH + 1 });
  });

  it('should handle multiple consecutive pushes', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });

    expect(stack.present).toEqual({ value: 4 });
    expect(stack.past).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
    ]);
    expect(stack.future).toEqual([]);
  });

  it('should handle pushing identical states', () => {
    const stack = createHistory({ value: 1 });
    const newStack = push(stack, { value: 1 });

    expect(newStack.present).toEqual({ value: 1 });
    expect(newStack.past).toEqual([{ value: 1 }]);
    expect(newStack.past.length).toBe(1);
  });
});

// ============================================================================
// TEST SUITE: undo
// ============================================================================

describe('undo', () => {
  it('should move to the previous state', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    const undoneStack = undo(stack);

    expect(undoneStack.present).toEqual({ value: 2 });
    expect(undoneStack.past).toEqual([{ value: 1 }]);
    expect(undoneStack.future).toEqual([{ value: 3 }]);
  });

  it('should return unchanged stack when no past states exist', () => {
    const stack = createHistory({ value: 1 });
    const undoneStack = undo(stack);

    expect(undoneStack).toBe(stack);
    expect(undoneStack.present).toEqual({ value: 1 });
    expect(undoneStack.past).toEqual([]);
    expect(undoneStack.future).toEqual([]);
  });

  it('should handle multiple consecutive undos', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });

    // Undo three times
    stack = undo(stack);
    stack = undo(stack);
    stack = undo(stack);

    expect(stack.present).toEqual({ value: 1 });
    expect(stack.past).toEqual([]);
    expect(stack.future).toEqual([
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ]);
  });

  it('should move present to future stack', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });

    const undoneStack = undo(stack);

    expect(undoneStack.future[0]).toEqual({ value: 2 });
    expect(undoneStack.future.length).toBe(1);
  });

  it('should accumulate future states on multiple undos', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    stack = undo(stack);
    expect(stack.future).toEqual([{ value: 3 }]);

    stack = undo(stack);
    expect(stack.future).toEqual([{ value: 2 }, { value: 3 }]);
  });
});

// ============================================================================
// TEST SUITE: redo
// ============================================================================

describe('redo', () => {
  it('should move to the next state', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    stack = undo(stack);
    stack = undo(stack);

    const redoneStack = redo(stack);

    expect(redoneStack.present).toEqual({ value: 2 });
    expect(redoneStack.past).toEqual([{ value: 1 }]);
    expect(redoneStack.future).toEqual([{ value: 3 }]);
  });

  it('should return unchanged stack when no future states exist', () => {
    const stack = createHistory({ value: 1 });
    const redoneStack = redo(stack);

    expect(redoneStack).toBe(stack);
    expect(redoneStack.present).toEqual({ value: 1 });
    expect(redoneStack.past).toEqual([]);
    expect(redoneStack.future).toEqual([]);
  });

  it('should handle multiple consecutive redos', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });

    // Undo three times
    stack = undo(stack);
    stack = undo(stack);
    stack = undo(stack);

    // Redo three times
    stack = redo(stack);
    stack = redo(stack);
    stack = redo(stack);

    expect(stack.present).toEqual({ value: 4 });
    expect(stack.past).toEqual([
      { value: 1 },
      { value: 2 },
      { value: 3 },
    ]);
    expect(stack.future).toEqual([]);
  });

  it('should move present to past stack', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);

    const redoneStack = redo(stack);

    expect(redoneStack.past).toEqual([{ value: 1 }]);
    expect(redoneStack.past.length).toBe(1);
  });
});

// ============================================================================
// TEST SUITE: canUndo
// ============================================================================

describe('canUndo', () => {
  it('should return false for initial stack', () => {
    const stack = createHistory({ value: 1 });
    expect(canUndo(stack)).toBe(false);
  });

  it('should return true after pushing a state', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });

    expect(canUndo(stack)).toBe(true);
  });

  it('should return false after undoing all states', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);

    expect(canUndo(stack)).toBe(false);
  });

  it('should return true when past has multiple states', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    expect(canUndo(stack)).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: canRedo
// ============================================================================

describe('canRedo', () => {
  it('should return false for initial stack', () => {
    const stack = createHistory({ value: 1 });
    expect(canRedo(stack)).toBe(false);
  });

  it('should return false after pushing a state', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });

    expect(canRedo(stack)).toBe(false);
  });

  it('should return true after undoing', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);

    expect(canRedo(stack)).toBe(true);
  });

  it('should return false after undoing then pushing new state', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);
    stack = push(stack, { value: 3 });

    expect(canRedo(stack)).toBe(false);
  });

  it('should return true when future has multiple states', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = undo(stack);
    stack = undo(stack);

    expect(canRedo(stack)).toBe(true);
  });
});

// ============================================================================
// TEST SUITE: getUndoCount
// ============================================================================

describe('getUndoCount', () => {
  it('should return 0 for initial stack', () => {
    const stack = createHistory({ value: 1 });
    expect(getUndoCount(stack)).toBe(0);
  });

  it('should return correct count after pushing states', () => {
    let stack = createHistory({ value: 1 });
    expect(getUndoCount(stack)).toBe(0);

    stack = push(stack, { value: 2 });
    expect(getUndoCount(stack)).toBe(1);

    stack = push(stack, { value: 3 });
    expect(getUndoCount(stack)).toBe(2);

    stack = push(stack, { value: 4 });
    expect(getUndoCount(stack)).toBe(3);
  });

  it('should return correct count after undo operations', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    expect(getUndoCount(stack)).toBe(2);

    stack = undo(stack);
    expect(getUndoCount(stack)).toBe(1);

    stack = undo(stack);
    expect(getUndoCount(stack)).toBe(0);
  });

  it('should return correct count after redo operations', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);

    expect(getUndoCount(stack)).toBe(0);

    stack = redo(stack);
    expect(getUndoCount(stack)).toBe(1);
  });
});

// ============================================================================
// TEST SUITE: getRedoCount
// ============================================================================

describe('getRedoCount', () => {
  it('should return 0 for initial stack', () => {
    const stack = createHistory({ value: 1 });
    expect(getRedoCount(stack)).toBe(0);
  });

  it('should return 0 after pushing states', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });

    expect(getRedoCount(stack)).toBe(0);
  });

  it('should return correct count after undo operations', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });

    expect(getRedoCount(stack)).toBe(0);

    stack = undo(stack);
    expect(getRedoCount(stack)).toBe(1);

    stack = undo(stack);
    expect(getRedoCount(stack)).toBe(2);

    stack = undo(stack);
    expect(getRedoCount(stack)).toBe(3);
  });

  it('should return correct count after redo operations', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = undo(stack);
    stack = undo(stack);

    expect(getRedoCount(stack)).toBe(2);

    stack = redo(stack);
    expect(getRedoCount(stack)).toBe(1);

    stack = redo(stack);
    expect(getRedoCount(stack)).toBe(0);
  });

  it('should return 0 after pushing following an undo', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = undo(stack);

    expect(getRedoCount(stack)).toBe(1);

    stack = push(stack, { value: 3 });
    expect(getRedoCount(stack)).toBe(0);
  });
});

// ============================================================================
// TEST SUITE: clearHistory
// ============================================================================

describe('clearHistory', () => {
  it('should clear past and future while keeping present', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = undo(stack);

    const clearedStack = clearHistory(stack);

    expect(clearedStack.present).toEqual({ value: 2 });
    expect(clearedStack.past).toEqual([]);
    expect(clearedStack.future).toEqual([]);
  });

  it('should work on initial stack', () => {
    const stack = createHistory({ value: 1 });
    const clearedStack = clearHistory(stack);

    expect(clearedStack.present).toEqual({ value: 1 });
    expect(clearedStack.past).toEqual([]);
    expect(clearedStack.future).toEqual([]);
  });

  it('should work after multiple operations', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });
    stack = undo(stack);
    stack = undo(stack);
    stack = redo(stack);

    const clearedStack = clearHistory(stack);

    expect(clearedStack.present).toEqual({ value: 3 });
    expect(clearedStack.past).toEqual([]);
    expect(clearedStack.future).toEqual([]);
    expect(canUndo(clearedStack)).toBe(false);
    expect(canRedo(clearedStack)).toBe(false);
  });
});

// ============================================================================
// TEST SUITE: Integration & Edge Cases
// ============================================================================

describe('Integration Tests', () => {
  it('should handle complex undo/redo/push workflow', () => {
    let stack = createHistory({ value: 1 });

    // Build history
    stack = push(stack, { value: 2 });
    stack = push(stack, { value: 3 });
    stack = push(stack, { value: 4 });

    // Undo twice
    stack = undo(stack);
    stack = undo(stack);
    expect(stack.present).toEqual({ value: 2 });

    // Redo once
    stack = redo(stack);
    expect(stack.present).toEqual({ value: 3 });

    // Push new change (should clear future)
    stack = push(stack, { value: 5 });
    expect(stack.present).toEqual({ value: 5 });
    expect(stack.future).toEqual([]);
    expect(getRedoCount(stack)).toBe(0);

    // Undo should go back to 3
    stack = undo(stack);
    expect(stack.present).toEqual({ value: 3 });
  });

  it('should maintain immutability - operations return new stacks', () => {
    const stack1 = createHistory({ value: 1 });
    const stack2 = push(stack1, { value: 2 });

    // Original stack should be unchanged
    expect(stack1.present).toEqual({ value: 1 });
    expect(stack1.past).toEqual([]);

    // New stack should have changes
    expect(stack2.present).toEqual({ value: 2 });
    expect(stack2.past).toEqual([{ value: 1 }]);
  });

  it('should handle MAX_HISTORY_DEPTH boundary correctly', () => {
    let stack = createHistory({ value: 0 });

    // Push exactly MAX_HISTORY_DEPTH states
    for (let i = 1; i <= MAX_HISTORY_DEPTH; i++) {
      stack = push(stack, { value: i });
    }

    expect(stack.past.length).toBe(MAX_HISTORY_DEPTH);
    expect(stack.past[0]).toEqual({ value: 0 });
    expect(stack.present).toEqual({ value: MAX_HISTORY_DEPTH });

    // Push one more - should drop the oldest
    stack = push(stack, { value: MAX_HISTORY_DEPTH + 1 });

    expect(stack.past.length).toBe(MAX_HISTORY_DEPTH);
    expect(stack.past[0]).toEqual({ value: 1 });
    expect(stack.present).toEqual({ value: MAX_HISTORY_DEPTH + 1 });
  });

  it('should work with session-like data structures', () => {
    interface SessionData {
      name: string;
      revenue: number;
      members: Array<{ id: string; handle: string }>;
    }

    const initial: SessionData = {
      name: 'Trading Mission',
      revenue: 0,
      members: [],
    };

    let stack = createHistory(initial);

    // Add member
    stack = push(stack, {
      ...stack.present,
      members: [{ id: '1', handle: 'Alice' }],
    });

    // Update revenue
    stack = push(stack, {
      ...stack.present,
      revenue: 1000,
    });

    // Add another member
    stack = push(stack, {
      ...stack.present,
      members: [...stack.present.members, { id: '2', handle: 'Bob' }],
    });

    expect(stack.present.members.length).toBe(2);
    expect(stack.present.revenue).toBe(1000);
    expect(getUndoCount(stack)).toBe(3);

    // Undo to previous state
    stack = undo(stack);
    expect(stack.present.members.length).toBe(1);
    expect(stack.present.revenue).toBe(1000);
  });

  it('should handle arrays and nested objects correctly', () => {
    const state1 = {
      items: [1, 2, 3],
      metadata: { version: 1 },
    };

    let stack = createHistory(state1);

    const state2 = {
      items: [1, 2, 3, 4],
      metadata: { version: 2 },
    };

    stack = push(stack, state2);
    stack = undo(stack);

    expect(stack.present.items).toEqual([1, 2, 3]);
    expect(stack.present.metadata.version).toBe(1);
  });

  it('should not allow undo/redo beyond boundaries', () => {
    let stack = createHistory({ value: 1 });
    stack = push(stack, { value: 2 });

    // Undo to initial state
    stack = undo(stack);
    expect(stack.present).toEqual({ value: 1 });

    // Try to undo again - should return same stack
    const beforeUndo = stack;
    stack = undo(stack);
    expect(stack).toBe(beforeUndo);
    expect(stack.present).toEqual({ value: 1 });

    // Redo to state 2
    stack = redo(stack);
    expect(stack.present).toEqual({ value: 2 });

    // Try to redo again - should return same stack
    const beforeRedo = stack;
    stack = redo(stack);
    expect(stack).toBe(beforeRedo);
    expect(stack.present).toEqual({ value: 2 });
  });
});
