import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as sessionStorage from '../../../lib/storage/sessionStorage';
import type { SessionInput, SavedSession } from '../../../lib/types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Assign mock to global
global.localStorage = localStorageMock as any;

// Mock generateId to return unique predictable IDs
let idCounter = 0;
vi.mock('../../../lib/id', () => ({
  generateId: vi.fn(() => `test-id-${++idCounter}`),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const createTestSession = (overrides?: Partial<SessionInput>): SessionInput => ({
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

describe('sessionStorage - save()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should save a new session to localStorage', () => {
    const session = createTestSession();
    const result = sessionStorage.save(session);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBeDefined();
    expect(result.data?.session.name).toBe('Test Session');
    expect(result.data?.createdAt).toBeDefined();
    expect(result.data?.updatedAt).toBeDefined();
  });

  it('should assign an ID to a session without one', () => {
    const session = createTestSession();
    const result = sessionStorage.save(session);

    expect(result.success).toBe(true);
    expect(result.data?.id).toMatch(/^test-id-/);
    expect(result.data?.session.id).toBe(result.data?.id);
  });

  it('should preserve existing ID when updating a session', () => {
    const session = createTestSession({ id: 'existing-id' });
    const result = sessionStorage.save(session);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('existing-id');
    expect(result.data?.session.id).toBe('existing-id');
  });

  it('should update an existing session by ID', () => {
    vi.useFakeTimers();

    const session1 = createTestSession({ id: 'session-1', name: 'First Version' });
    const result1 = sessionStorage.save(session1);

    expect(result1.success).toBe(true);
    const createdAt = result1.data?.createdAt;

    // Advance time to ensure updatedAt differs from createdAt
    vi.advanceTimersByTime(1000);

    // Update the session
    const session2 = createTestSession({ id: 'session-1', name: 'Updated Version' });
    const result2 = sessionStorage.save(session2);

    expect(result2.success).toBe(true);
    expect(result2.data?.session.name).toBe('Updated Version');
    expect(result2.data?.createdAt).toBe(createdAt); // Should preserve createdAt
    expect(result2.data?.updatedAt).not.toBe(createdAt); // Should update updatedAt

    // Verify only one session exists
    const allSessions = sessionStorage.getAll();
    expect(allSessions.length).toBe(1);

    vi.useRealTimers();
  });

  it('should save multiple sessions', () => {
    const session1 = createTestSession({ name: 'Session 1' });
    const session2 = createTestSession({ name: 'Session 2' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);

    const allSessions = sessionStorage.getAll();
    expect(allSessions.length).toBe(2);
  });

  it('should handle QuotaExceededError', () => {
    // Mock setItem to throw QuotaExceededError
    localStorageMock.setItem.mockImplementationOnce(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const session = createTestSession();
    const result = sessionStorage.save(session);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage quota exceeded');
  });

  it('should handle generic errors', () => {
    // Mock setItem to throw a generic error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Generic storage error');
    });

    const session = createTestSession();
    const result = sessionStorage.save(session);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Generic storage error');
  });

  it('should preserve all session fields', () => {
    const session = createTestSession({
      name: 'Complex Session',
      type: 'MINING',
      currency: 'aUEC',
      totalRevenue: 5000,
      distributionMode: 'PERCENT',
      taxEnabled: true,
      taxRate: 0.05,
      members: [
        {
          id: 'member-1',
          handle: 'Alice',
          role: 'Captain',
          active: true,
          revenue: 3000,
          investment: 1000,
          percentShare: 60,
        },
        {
          id: 'member-2',
          handle: 'Bob',
          role: 'Crew',
          active: true,
          revenue: 2000,
          investment: 500,
          percentShare: 40,
        },
      ],
      sharedExpenses: [{ label: 'Fuel', amount: 200 }],
      individualExpenses: [{ memberId: 'member-1', label: 'Repair', amount: 100 }],
    });

    const result = sessionStorage.save(session);

    expect(result.success).toBe(true);
    expect(result.data?.session.name).toBe('Complex Session');
    expect(result.data?.session.type).toBe('MINING');
    expect(result.data?.session.currency).toBe('aUEC');
    expect(result.data?.session.totalRevenue).toBe(5000);
    expect(result.data?.session.distributionMode).toBe('PERCENT');
    expect(result.data?.session.taxEnabled).toBe(true);
    expect(result.data?.session.taxRate).toBe(0.05);
    expect(result.data?.session.members.length).toBe(2);
    expect(result.data?.session.sharedExpenses?.length).toBe(1);
    expect(result.data?.session.individualExpenses?.length).toBe(1);
  });
});

describe('sessionStorage - getAll()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should return an empty array when no sessions exist', () => {
    const sessions = sessionStorage.getAll();
    expect(sessions).toEqual([]);
  });

  it('should return all saved sessions', () => {
    const session1 = createTestSession({ name: 'Session 1' });
    const session2 = createTestSession({ name: 'Session 2' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);

    const sessions = sessionStorage.getAll();
    expect(sessions.length).toBe(2);
  });

  it('should return sessions sorted by most recent first', () => {
    vi.useFakeTimers();

    // Save sessions with delays to ensure different timestamps
    const session1 = createTestSession({ name: 'First' });
    sessionStorage.save(session1);

    // Wait a bit
    vi.advanceTimersByTime(100);

    const session2 = createTestSession({ name: 'Second' });
    sessionStorage.save(session2);

    const sessions = sessionStorage.getAll();

    expect(sessions.length).toBe(2);
    // Most recent should be first
    expect(sessions[0].session.name).toBe('Second');
    expect(sessions[1].session.name).toBe('First');

    vi.useRealTimers();
  });

  it('should filter out invalid sessions', () => {
    // Manually add corrupt data to localStorage
    const validSession = createTestSession();
    sessionStorage.save(validSession);

    // Add invalid data directly
    const corruptData = [
      { invalid: 'data' },
      { id: 'valid', session: {}, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    localStorageMock.setItem('sc-payslip-sessions', JSON.stringify(corruptData));

    const sessions = sessionStorage.getAll();

    // Should return empty array since both items are invalid
    expect(sessions).toEqual([]);
  });

  it('should handle corrupt localStorage data gracefully', () => {
    // Set invalid JSON
    localStorageMock.setItem('sc-payslip-sessions', 'invalid json {]');

    const sessions = sessionStorage.getAll();
    expect(sessions).toEqual([]);
  });

  it('should handle non-array data in localStorage', () => {
    // Set non-array data
    localStorageMock.setItem('sc-payslip-sessions', JSON.stringify({ not: 'an array' }));

    const sessions = sessionStorage.getAll();
    expect(sessions).toEqual([]);
  });

  it('should handle localStorage unavailable', () => {
    // Mock getItem to throw an error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available');
    });

    const sessions = sessionStorage.getAll();
    expect(sessions).toEqual([]);
  });
});

describe('sessionStorage - deleteSession()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should delete a session by ID', () => {
    const session1 = createTestSession({ id: 'session-1', name: 'Session 1' });
    const session2 = createTestSession({ id: 'session-2', name: 'Session 2' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);

    const result = sessionStorage.deleteSession('session-1');

    expect(result.success).toBe(true);

    const sessions = sessionStorage.getAll();
    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe('session-2');
  });

  it('should succeed even if session ID does not exist', () => {
    const session = createTestSession({ id: 'session-1' });
    sessionStorage.save(session);

    const result = sessionStorage.deleteSession('non-existent-id');

    expect(result.success).toBe(true);

    const sessions = sessionStorage.getAll();
    expect(sessions.length).toBe(1);
  });

  it('should handle errors during deletion', () => {
    const session = createTestSession({ id: 'session-1' });
    sessionStorage.save(session);

    // Mock setItem to throw an error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Failed to delete');
    });

    const result = sessionStorage.deleteSession('session-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to delete');
  });

  it('should delete all sessions when called multiple times', () => {
    const session1 = createTestSession({ id: 'session-1' });
    const session2 = createTestSession({ id: 'session-2' });
    const session3 = createTestSession({ id: 'session-3' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);
    sessionStorage.save(session3);

    sessionStorage.deleteSession('session-1');
    sessionStorage.deleteSession('session-2');
    sessionStorage.deleteSession('session-3');

    const sessions = sessionStorage.getAll();
    expect(sessions.length).toBe(0);
  });
});

describe('sessionStorage - exportAll()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should export sessions as JSON string', () => {
    const session = createTestSession({ name: 'Export Test' });
    sessionStorage.save(session);

    const exported = sessionStorage.exportAll();

    expect(typeof exported).toBe('string');
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  it('should export an empty array when no sessions exist', () => {
    const exported = sessionStorage.exportAll();
    const parsed = JSON.parse(exported);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(0);
  });

  it('should export all session data with formatting', () => {
    const session = createTestSession({ name: 'Export Test' });
    sessionStorage.save(session);

    const exported = sessionStorage.exportAll();

    // Should be formatted with 2-space indentation
    expect(exported).toContain('\n');
    expect(exported).toContain('  ');
  });

  it('should export multiple sessions', () => {
    const session1 = createTestSession({ name: 'Session 1' });
    const session2 = createTestSession({ name: 'Session 2' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);

    const exported = sessionStorage.exportAll();
    const parsed = JSON.parse(exported);

    expect(parsed.length).toBe(2);
  });

  it('should export sessions that can be re-imported', () => {
    const session = createTestSession({
      name: 'Round-trip Test',
      members: [
        { id: 'member-1', handle: 'Alice', active: true, revenue: 1000 },
      ],
    });

    sessionStorage.save(session);
    const exported = sessionStorage.exportAll();

    // Clear and re-import
    sessionStorage.clearAll();
    const importResult = sessionStorage.importAll(exported);

    expect(importResult.success).toBe(true);
    expect(importResult.data?.count).toBeGreaterThan(0);
  });
});

describe('sessionStorage - importAll()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should import valid sessions from JSON string', () => {
    const sessions: SavedSession[] = [
      {
        id: 'import-1',
        session: createTestSession({ id: 'import-1', name: 'Imported Session' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const jsonData = JSON.stringify(sessions);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(1);
  });

  it('should regenerate IDs for imported sessions to prevent conflicts', () => {
    const existingSession = createTestSession({ id: 'existing-id', name: 'Existing' });
    sessionStorage.save(existingSession);

    const importedSessions: SavedSession[] = [
      {
        id: 'existing-id', // Same ID as existing session
        session: createTestSession({ id: 'existing-id', name: 'Imported' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const jsonData = JSON.stringify(importedSessions);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(true);

    const allSessions = sessionStorage.getAll();
    expect(allSessions.length).toBe(2); // Both sessions should exist

    // IDs should be different
    const ids = allSessions.map(s => s.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('should merge imported sessions with existing ones', () => {
    const existingSession = createTestSession({ name: 'Existing' });
    sessionStorage.save(existingSession);

    const importedSessions: SavedSession[] = [
      {
        id: 'import-1',
        session: createTestSession({ id: 'import-1', name: 'Imported' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    const jsonData = JSON.stringify(importedSessions);
    sessionStorage.importAll(jsonData);

    const allSessions = sessionStorage.getAll();
    expect(allSessions.length).toBe(2);
  });

  it('should reject invalid JSON', () => {
    const result = sessionStorage.importAll('invalid json {]');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid JSON format');
  });

  it('should reject non-array data', () => {
    const result = sessionStorage.importAll(JSON.stringify({ not: 'an array' }));

    expect(result.success).toBe(false);
    expect(result.error).toContain('expected an array');
  });

  it('should filter out invalid sessions during import', () => {
    const mixedData = [
      {
        id: 'valid-1',
        session: createTestSession({ id: 'valid-1', name: 'Valid' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        invalid: 'data',
      },
    ];

    const jsonData = JSON.stringify(mixedData);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(1); // Only valid session imported
  });

  it('should fail if no valid sessions found', () => {
    const invalidData = [
      { invalid: 'data' },
      { also: 'invalid' },
    ];

    const jsonData = JSON.stringify(invalidData);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No valid sessions found');
  });

  it('should handle QuotaExceededError during import', () => {
    const sessions: SavedSession[] = [
      {
        id: 'import-1',
        session: createTestSession({ id: 'import-1', name: 'Import' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // Mock setItem to throw QuotaExceededError
    localStorageMock.setItem.mockImplementationOnce(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const jsonData = JSON.stringify(sessions);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage quota exceeded');
  });

  it('should import multiple sessions at once', () => {
    const sessions: SavedSession[] = [
      {
        id: 'import-1',
        session: createTestSession({ id: 'import-1', name: 'Import 1' }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'import-2',
        session: createTestSession({ id: 'import-2', name: 'Import 2' }),
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'import-3',
        session: createTestSession({ id: 'import-3', name: 'Import 3' }),
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    ];

    const jsonData = JSON.stringify(sessions);
    const result = sessionStorage.importAll(jsonData);

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(3);

    const allSessions = sessionStorage.getAll();
    expect(allSessions.length).toBe(3);
  });
});

describe('sessionStorage - clearAll()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should clear all sessions from localStorage', () => {
    const session1 = createTestSession({ name: 'Session 1' });
    const session2 = createTestSession({ name: 'Session 2' });

    sessionStorage.save(session1);
    sessionStorage.save(session2);

    const result = sessionStorage.clearAll();

    expect(result.success).toBe(true);

    const sessions = sessionStorage.getAll();
    expect(sessions.length).toBe(0);
  });

  it('should succeed even when no sessions exist', () => {
    const result = sessionStorage.clearAll();

    expect(result.success).toBe(true);
  });

  it('should handle errors during clear', () => {
    // Mock removeItem to throw an error
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error('Failed to clear');
    });

    const result = sessionStorage.clearAll();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to clear');
  });
});



describe('sessionStorage - draft reference', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should remember the current draft id after save', () => {
    const session = createTestSession();
    const result = sessionStorage.save(session);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(sessionStorage.getCurrentDraftId());
  });

  it('should return the draft session object', () => {
    const session = createTestSession({ name: 'Draft Session' });
    const saved = sessionStorage.save(session);

    const draft = sessionStorage.getCurrentDraft();
    expect(draft).toBeDefined();
    expect(draft?.id).toBe(saved.data?.id);
    expect(draft?.session.name).toBe('Draft Session');
  });

  it('should clear the draft reference', () => {
    const session = createTestSession();
    sessionStorage.save(session);
    sessionStorage.clearCurrentDraftId();

    expect(sessionStorage.getCurrentDraftId()).toBeNull();
  });
});
describe('sessionStorage - edge cases', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should handle rapid successive saves without data loss', () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      createTestSession({ name: `Session ${i}` })
    );

    sessions.forEach(session => sessionStorage.save(session));

    const savedSessions = sessionStorage.getAll();
    expect(savedSessions.length).toBe(10);
  });

  it('should preserve data types during save and retrieve', () => {
    const session = createTestSession({
      name: 'Type Test',
      totalRevenue: 1000,
      taxEnabled: true,
      taxRate: 0.05,
      members: [
        {
          id: 'member-1',
          handle: 'Alice',
          active: true,
          revenue: 1000,
          investment: 500,
          percentShare: 50,
        },
      ],
    });

    sessionStorage.save(session);
    const retrieved = sessionStorage.getAll()[0];

    expect(typeof retrieved.session.name).toBe('string');
    expect(typeof retrieved.session.totalRevenue).toBe('number');
    expect(typeof retrieved.session.taxEnabled).toBe('boolean');
    expect(typeof retrieved.session.taxRate).toBe('number');
    expect(Array.isArray(retrieved.session.members)).toBe(true);
  });

  it('should handle sessions with minimal data', () => {
    const minimalSession: SessionInput = {
      name: 'Minimal',
      type: 'OTHER',
      distributionMode: 'EQUAL',
      members: [],
    };

    const result = sessionStorage.save(minimalSession);

    expect(result.success).toBe(true);
    expect(result.data?.session.members.length).toBe(0);
  });

  it('should handle sessions with all optional fields populated', () => {
    const maximalSession = createTestSession({
      id: 'maximal-1',
      name: 'Maximal Session',
      type: 'MINING',
      currency: 'aUEC',
      totalRevenue: 10000,
      distributionMode: 'ADJUSTABLE',
      taxEnabled: true,
      taxRate: 0.1,
      members: [
        {
          id: 'member-1',
          handle: 'Alice',
          role: 'Captain',
          active: true,
          revenue: 5000,
          investment: 2000,
          percentShare: 50,
          fixedBonus: 100,
          fixedPayout: 1000,
        },
      ],
      sharedExpenses: [
        { id: 'expense-1', label: 'Fuel', amount: 500, participantIds: ['member-1'] },
      ],
      individualExpenses: [
        { id: 'expense-2', memberId: 'member-1', label: 'Repair', amount: 200 },
      ],
    });

    const result = sessionStorage.save(maximalSession);

    expect(result.success).toBe(true);
    expect(result.data?.session).toMatchObject({
      name: 'Maximal Session',
      type: 'MINING',
      currency: 'aUEC',
      totalRevenue: 10000,
      distributionMode: 'ADJUSTABLE',
      taxEnabled: true,
      taxRate: 0.1,
    });
  });

  it('should maintain timestamp consistency', () => {
    vi.useFakeTimers();

    const session = createTestSession({ id: 'timestamp-test' });
    const result1 = sessionStorage.save(session);

    const createdAt = result1.data?.createdAt;
    const updatedAt1 = result1.data?.updatedAt;

    expect(createdAt).toBe(updatedAt1);

    // Update the session
    vi.advanceTimersByTime(1000);
    const result2 = sessionStorage.save(session);

    expect(result2.data?.createdAt).toBe(createdAt);
    expect(result2.data?.updatedAt).not.toBe(updatedAt1);

    vi.useRealTimers();
  });
});
