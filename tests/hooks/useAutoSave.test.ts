import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { SessionInput } from '../../lib/types';
import * as sessionStorage from '../../lib/storage/sessionStorage';

// ============================================================================
// MOCKS
// ============================================================================

// Mock sessionStorage module
vi.mock('../../lib/storage/sessionStorage', () => ({
  save: vi.fn(),
  getAll: vi.fn(() => []),
  getById: vi.fn(),
  deleteById: vi.fn(),
}));

// Mock timers
vi.useFakeTimers();

// ============================================================================
// TEST DATA
// ============================================================================

const createTestSession = (overrides?: Partial<SessionInput>): SessionInput => ({
  id: 'test-session-1',
  name: 'Test Session',
  type: 'TRADING',
  distributionMode: 'EQUAL',
  totalRevenue: 1000,
  taxEnabled: false,
  members: [
    { id: 'member-1', handle: 'Alice', role: 'Member', active: true, revenue: 500 },
    { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 },
  ],
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('useAutoSave - Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with unsaved status for new session', () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Should be unsaved initially (previousRef is null, session is not null)
    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.error).toBeNull();
    expect(typeof result.current.manualSave).toBe('function');

    // Verify save hasn't been called yet (debounce delay hasn't passed)
    expect(sessionStorage.save).not.toHaveBeenCalled();
  });

  it('should handle null session', () => {
    const { result } = renderHook(() => useAutoSave(null));

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.error).toBeNull();
  });

  it('should initialize with disabled auto-save', () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session, false));

    expect(result.current.saveStatus).toBe('saved');
    expect(sessionStorage.save).not.toHaveBeenCalled();
  });
});

describe('useAutoSave - Debouncing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should mark as unsaved immediately when session changes', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save to complete
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');

    vi.clearAllMocks();

    // Change session
    const updatedSession = createTestSession({ name: 'Updated Session' });
    rerender({ session: updatedSession });

    // Should immediately mark as unsaved
    expect(result.current.saveStatus).toBe('unsaved');
    expect(sessionStorage.save).not.toHaveBeenCalled();
  });

  it('should save after 1 second debounce delay', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // Change session
    const updatedSession = createTestSession({ name: 'Updated Session' });
    rerender({ session: updatedSession });

    expect(result.current.saveStatus).toBe('unsaved');

    // Fast-forward time by 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should have saved
    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should cancel previous timer on rapid changes', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // First change
    const updatedSession1 = createTestSession({ name: 'Update 1' });
    rerender({ session: updatedSession1 });

    // Advance time by 500ms (half of debounce delay)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(sessionStorage.save).not.toHaveBeenCalled();

    // Second change before debounce completes
    const updatedSession2 = createTestSession({ name: 'Update 2' });
    rerender({ session: updatedSession2 });

    // Advance another 500ms (should not trigger save yet)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(sessionStorage.save).not.toHaveBeenCalled();

    // Advance full 1000ms from second change
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should only save the latest version
    expect(sessionStorage.save).toHaveBeenCalledTimes(1);
    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession2);
  });

  it('should not trigger save if session has not changed', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // Rerender with same session data (but different object reference)
    const sameSession = createTestSession();
    rerender({ session: sameSession });

    // Advance time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should not save because data is identical
    expect(sessionStorage.save).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('saved');
  });
});

describe('useAutoSave - Manual Save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should save immediately on manual save', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Trigger manual save
    await act(async () => {
      await result.current.manualSave();
    });

    expect(sessionStorage.save).toHaveBeenCalledWith(session);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should cancel pending debounced save on manual save', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Change session to trigger debounced save
    const updatedSession = createTestSession({ name: 'Updated' });
    rerender({ session: updatedSession });

    expect(result.current.saveStatus).toBe('unsaved');

    // Advance time by 500ms (not enough to trigger debounced save)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(sessionStorage.save).not.toHaveBeenCalled();

    // Trigger manual save
    await act(async () => {
      await result.current.manualSave();
    });

    // Should have saved immediately
    expect(sessionStorage.save).toHaveBeenCalledTimes(1);
    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession);
    expect(result.current.saveStatus).toBe('saved');

    // Advance remaining time
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should not save again (debounced save was cancelled)
    expect(sessionStorage.save).toHaveBeenCalledTimes(1);
  });

  it('should set status to saved after manual save completes', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Mock save to succeed
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });

    await act(async () => {
      await result.current.manualSave();
    });

    // Should be saved after completion
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.error).toBeNull();
  });

  it('should work with null session', async () => {
    const { result } = renderHook(() => useAutoSave(null));

    await act(async () => {
      await result.current.manualSave();
    });

    // Should not crash, should not save
    expect(sessionStorage.save).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('saved');
  });
});

describe('useAutoSave - Enabled/Disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should not auto-save when disabled', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session, enabled }) => useAutoSave(session, enabled),
      { initialProps: { session, enabled: false } }
    );

    // Change session
    const updatedSession = createTestSession({ name: 'Updated' });
    rerender({ session: updatedSession, enabled: false });

    // Advance time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have saved
    expect(sessionStorage.save).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should allow manual save when disabled', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session, false));

    await act(async () => {
      await result.current.manualSave();
    });

    expect(sessionStorage.save).toHaveBeenCalledWith(session);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should resume auto-save when re-enabled', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session, enabled }) => useAutoSave(session, enabled),
      { initialProps: { session, enabled: false } }
    );

    // Change session while disabled
    const updatedSession = createTestSession({ name: 'Updated' });
    rerender({ session: updatedSession, enabled: false });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(sessionStorage.save).not.toHaveBeenCalled();

    // Re-enable auto-save (should trigger auto-save for updatedSession)
    rerender({ session: updatedSession, enabled: true });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should have saved the updatedSession
    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession);
    expect(result.current.saveStatus).toBe('saved');

    vi.clearAllMocks();

    // Change session again
    const updatedSession2 = createTestSession({ name: 'Updated Again' });
    rerender({ session: updatedSession2, enabled: true });

    // Should trigger auto-save now
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession2);
    expect(result.current.saveStatus).toBe('saved');
  });
});

describe('useAutoSave - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should set error and unsaved status on save failure', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Mock save to fail
    vi.mocked(sessionStorage.save).mockReturnValue({
      success: false,
      error: 'Storage quota exceeded',
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.error).toBe('Storage quota exceeded');
  });

  it('should handle save error without error message', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Mock save to fail without error message
    vi.mocked(sessionStorage.save).mockReturnValue({
      success: false,
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.error).toBe('Failed to save session');
  });

  it('should handle thrown exceptions during save', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Mock save to throw
    vi.mocked(sessionStorage.save).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.error).toBe('Unexpected error');
  });

  it('should handle non-Error exceptions', async () => {
    const session = createTestSession();
    const { result } = renderHook(() => useAutoSave(session));

    // Mock save to throw non-Error
    vi.mocked(sessionStorage.save).mockImplementation(() => {
      throw 'String error';
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.saveStatus).toBe('unsaved');
    expect(result.current.error).toBe('Unknown error occurred');
  });

  it('should clear error on successful save', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // First save fails
    vi.mocked(sessionStorage.save).mockReturnValue({
      success: false,
      error: 'Storage error',
    });

    await act(async () => {
      await result.current.manualSave();
    });

    expect(result.current.error).toBe('Storage error');

    // Second save succeeds
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });

    const updatedSession = createTestSession({ name: 'Updated' });
    rerender({ session: updatedSession });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.error).toBeNull();
  });
});

describe('useAutoSave - Session Change Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should detect changes in nested objects', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // Change nested member data
    const updatedSession = createTestSession({
      members: [
        { id: 'member-1', handle: 'Alice Updated', role: 'Member', active: true, revenue: 500 },
        { id: 'member-2', handle: 'Bob', role: 'Member', active: true, revenue: 500 },
      ],
    });
    rerender({ session: updatedSession });

    expect(result.current.saveStatus).toBe('unsaved');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should detect changes in array length', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // Add a new member
    const updatedSession = createTestSession({
      members: [
        ...session.members,
        { id: 'member-3', handle: 'Charlie', role: 'Member', active: true, revenue: 300 },
      ],
    });
    rerender({ session: updatedSession });

    expect(result.current.saveStatus).toBe('unsaved');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession);
    expect(result.current.saveStatus).toBe('saved');
  });

  it('should not trigger save after successful auto-save completes', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');

    const saveCount = vi.mocked(sessionStorage.save).mock.calls.length;

    // Rerender with same session (should not trigger another save)
    rerender({ session });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have saved again
    expect(sessionStorage.save).toHaveBeenCalledTimes(saveCount);
    expect(result.current.saveStatus).toBe('saved');
  });
});

describe('useAutoSave - Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.mocked(sessionStorage.save).mockReturnValue({ success: true, data: undefined });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should cleanup timer on unmount', async () => {
    const session = createTestSession();
    const { result, rerender, unmount } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Change session to start timer
    const updatedSession = createTestSession({ name: 'Updated' });
    rerender({ session: updatedSession });

    expect(result.current.saveStatus).toBe('unsaved');

    // Unmount before timer fires
    unmount();

    // Advance time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have saved after unmount
    expect(sessionStorage.save).not.toHaveBeenCalled();
  });

  it('should cleanup timer on session change', async () => {
    const session = createTestSession();
    const { result, rerender } = renderHook(
      ({ session }) => useAutoSave(session),
      { initialProps: { session } }
    );

    // Wait for initial auto-save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe('saved');
    vi.clearAllMocks();

    // First change
    const updatedSession1 = createTestSession({ name: 'Update 1' });
    rerender({ session: updatedSession1 });

    // Second change before first timer fires
    const updatedSession2 = createTestSession({ name: 'Update 2' });
    rerender({ session: updatedSession2 });

    // Advance full time
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should only save once (with latest data)
    expect(sessionStorage.save).toHaveBeenCalledTimes(1);
    expect(sessionStorage.save).toHaveBeenCalledWith(updatedSession2);
  });
});
