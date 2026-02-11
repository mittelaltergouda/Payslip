import { save, getAll, getByIds, clearAll, bulkDelete } from './sessionStorage';
import type { SessionInput } from '../types';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Helper to create a basic session input
function createTestSessionInput(overrides: Partial<SessionInput> = {}): SessionInput {
  return {
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
  };
}

// Test cases for bulkDelete() function

describe('bulkDelete', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('basic deletion', () => {
    it('should delete multiple sessions by their IDs', () => {
      // Save three sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;
      const id3 = result3.data!.id;

      // Verify all three sessions exist
      let allSessions = getAll();
      expect(allSessions.length).toBe(3);

      // Delete two sessions
      const deleteResult = bulkDelete([id1, id3]);

      expect(deleteResult.success).toBe(true);

      // Verify only session 2 remains
      allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].id).toBe(id2);
      expect(allSessions[0].session.name).toBe('Session 2');
    });

    it('should delete a single session when array has one ID', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      const deleteResult = bulkDelete([id1]);

      expect(deleteResult.success).toBe(true);

      const allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].id).toBe(id2);
    });

    it('should delete all sessions when all IDs are provided', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;
      const id3 = result3.data!.id;

      const deleteResult = bulkDelete([id1, id2, id3]);

      expect(deleteResult.success).toBe(true);

      const allSessions = getAll();
      expect(allSessions.length).toBe(0);
    });

    it('should return success when deleting from storage', () => {
      const session = createTestSessionInput();
      const saveResult = save(session);
      const sessionId = saveResult.data!.id;

      const deleteResult = bulkDelete([sessionId]);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBeUndefined();
      expect(deleteResult.error).toBeUndefined();
    });
  });

  describe('empty and non-existent IDs', () => {
    it('should handle empty array gracefully', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      save(session1);
      save(session2);

      // Delete with empty array
      const deleteResult = bulkDelete([]);

      expect(deleteResult.success).toBe(true);

      // All sessions should still exist
      const allSessions = getAll();
      expect(allSessions.length).toBe(2);
    });

    it('should ignore non-existent IDs', () => {
      const session = createTestSessionInput({ name: 'Existing Session' });
      const saveResult = save(session);
      const existingId = saveResult.data!.id;

      // Try to delete non-existent IDs along with existing one
      const deleteResult = bulkDelete(['non-existent-1', 'non-existent-2']);

      expect(deleteResult.success).toBe(true);

      // Existing session should remain
      const allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].id).toBe(existingId);
    });

    it('should handle mix of existent and non-existent IDs', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;
      const id3 = result3.data!.id;

      // Delete mix of existing and non-existing
      const deleteResult = bulkDelete([id1, 'non-existent-1', id3, 'non-existent-2']);

      expect(deleteResult.success).toBe(true);

      // Only session 2 should remain
      const allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].id).toBe(id2);
    });

    it('should handle deleting when storage is already empty', () => {
      // No sessions saved
      const deleteResult = bulkDelete(['some-id', 'another-id']);

      expect(deleteResult.success).toBe(true);

      const allSessions = getAll();
      expect(allSessions.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate IDs in the delete array', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      // Delete with duplicate IDs in array
      const deleteResult = bulkDelete([id1, id1, id1]);

      expect(deleteResult.success).toBe(true);

      // Only session 2 should remain
      const allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].id).toBe(id2);
    });

    it('should handle deleting from large number of sessions', () => {
      // Create 50 sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        sessionIds.push(result.data!.id);
      }

      // Verify all 50 exist
      expect(getAll().length).toBe(50);

      // Delete every other session (25 sessions)
      const idsToDelete = sessionIds.filter((_, index) => index % 2 === 0);
      const deleteResult = bulkDelete(idsToDelete);

      expect(deleteResult.success).toBe(true);

      // 25 sessions should remain
      const remainingSessions = getAll();
      expect(remainingSessions.length).toBe(25);

      // Verify the correct sessions remain
      const remainingIds = new Set(remainingSessions.map(s => s.id));
      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          expect(remainingIds.has(sessionIds[i])).toBe(false);
        } else {
          expect(remainingIds.has(sessionIds[i])).toBe(true);
        }
      }
    });

    it('should handle very long ID arrays', () => {
      // Create 10 sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        sessionIds.push(result.data!.id);
      }

      // Create array with 100 IDs (10 real, 90 fake)
      const massiveDeleteArray = [
        ...sessionIds,
        ...Array.from({ length: 90 }, (_, i) => `fake-id-${i}`)
      ];

      const deleteResult = bulkDelete(massiveDeleteArray);

      expect(deleteResult.success).toBe(true);

      // All real sessions should be deleted
      const allSessions = getAll();
      expect(allSessions.length).toBe(0);
    });

    it('should preserve remaining sessions correctly after deletion', () => {
      // Create sessions with specific data
      const session1 = createTestSessionInput({
        name: 'Trading Session',
        type: 'TRADING',
        totalRevenue: 5000,
        members: [
          { id: 'member-1', handle: 'Trader1', role: 'Member', active: true },
        ],
      });
      const session2 = createTestSessionInput({
        name: 'Mining Session',
        type: 'MINING',
        totalRevenue: 3000,
        members: [
          { id: 'member-2', handle: 'Miner1', role: 'Member', active: true },
        ],
      });
      const session3 = createTestSessionInput({
        name: 'Combat Session',
        type: 'BOUNTY',
        totalRevenue: 10000,
        members: [
          { id: 'member-3', handle: 'Fighter1', role: 'Member', active: true },
        ],
      });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      const id1 = result1.data!.id;
      const id3 = result3.data!.id;

      // Delete sessions 1 and 3, keep session 2
      const deleteResult = bulkDelete([id1, id3]);

      expect(deleteResult.success).toBe(true);

      // Verify session 2 is intact
      const remainingSessions = getAll();
      expect(remainingSessions.length).toBe(1);

      const miningSession = remainingSessions[0];
      expect(miningSession.session.name).toBe('Mining Session');
      expect(miningSession.session.type).toBe('MINING');
      expect(miningSession.session.totalRevenue).toBe(3000);
      expect(miningSession.session.members.length).toBe(1);
      expect(miningSession.session.members[0].handle).toBe('Miner1');
    });

    it('should not corrupt storage when deleting partial set', () => {
      // Create sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });
      const session4 = createTestSessionInput({ name: 'Session 4' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);
      const result4 = save(session4);

      const id2 = result2.data!.id;
      const id4 = result4.data!.id;

      // Delete sessions 2 and 4
      bulkDelete([id2, id4]);

      // Storage should still be valid and readable
      const remainingSessions = getAll();
      expect(remainingSessions.length).toBe(2);

      // Check that the correct sessions remain (order may vary due to sorting)
      const remainingNames = new Set(remainingSessions.map(s => s.session.name));
      expect(remainingNames.has('Session 1')).toBe(true);
      expect(remainingNames.has('Session 3')).toBe(true);
      expect(remainingNames.has('Session 2')).toBe(false);
      expect(remainingNames.has('Session 4')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const session = createTestSessionInput();
      save(session);

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('localStorage error');
      };

      const deleteResult = bulkDelete(['some-id']);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('localStorage error');

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle quota exceeded error', () => {
      const session = createTestSessionInput();
      save(session);

      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorageMock.setItem;
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem = () => {
        throw quotaError;
      };

      const deleteResult = bulkDelete(['some-id']);

      expect(deleteResult.success).toBe(false);
      // The function doesn't specifically handle QuotaExceededError for delete
      // so it should return the error message
      expect(deleteResult.error).toBe('QuotaExceededError');

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should return generic error message for unknown errors', () => {
      const session = createTestSessionInput();
      save(session);

      // Mock localStorage.setItem to throw non-Error object
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw 'String error';
      };

      const deleteResult = bulkDelete(['some-id']);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Failed to delete sessions');

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should not modify storage if error occurs during save', () => {
      // Save some sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;

      // Get state before delete attempt
      const sessionsBefore = getAll();
      expect(sessionsBefore.length).toBe(2);

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('Write failed');
      };

      // Attempt to delete
      const deleteResult = bulkDelete([id1]);

      expect(deleteResult.success).toBe(false);

      // Restore setItem
      localStorageMock.setItem = originalSetItem;

      // Storage should be unchanged (both sessions still present)
      const sessionsAfter = getAll();
      expect(sessionsAfter.length).toBe(2);
    });
  });

  describe('interaction with other operations', () => {
    it('should work correctly after save operations', () => {
      const session1 = createTestSessionInput({ name: 'First' });
      const result1 = save(session1);
      const id1 = result1.data!.id;

      const session2 = createTestSessionInput({ name: 'Second' });
      const result2 = save(session2);

      const deleteResult = bulkDelete([id1]);

      expect(deleteResult.success).toBe(true);

      const remainingSessions = getAll();
      expect(remainingSessions.length).toBe(1);
      expect(remainingSessions[0].session.name).toBe('Second');
    });

    it('should work correctly with getAll', () => {
      // Save sessions
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        ids.push(result.data!.id);
      }

      // Get all before delete
      const beforeDelete = getAll();
      expect(beforeDelete.length).toBe(5);

      // Delete some sessions
      bulkDelete([ids[1], ids[3]]);

      // Get all after delete
      const afterDelete = getAll();
      expect(afterDelete.length).toBe(3);

      // Verify correct sessions remain
      const remainingIds = new Set(afterDelete.map(s => s.id));
      expect(remainingIds.has(ids[0])).toBe(true);
      expect(remainingIds.has(ids[1])).toBe(false);
      expect(remainingIds.has(ids[2])).toBe(true);
      expect(remainingIds.has(ids[3])).toBe(false);
      expect(remainingIds.has(ids[4])).toBe(true);
    });

    it('should work correctly before and after clearAll', () => {
      // Save sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const result1 = save(session1);
      save(session2);

      const id1 = result1.data!.id;

      // Delete one session
      bulkDelete([id1]);
      expect(getAll().length).toBe(1);

      // Clear all
      clearAll();
      expect(getAll().length).toBe(0);

      // BulkDelete on empty storage should work
      const deleteResult = bulkDelete(['non-existent']);
      expect(deleteResult.success).toBe(true);
      expect(getAll().length).toBe(0);
    });

    it('should allow saving new sessions after bulk delete', () => {
      // Save and delete sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const result1 = save(session1);
      const id1 = result1.data!.id;

      bulkDelete([id1]);
      expect(getAll().length).toBe(0);

      // Save new session after delete
      const newSession = createTestSessionInput({ name: 'New Session' });
      const saveResult = save(newSession);

      expect(saveResult.success).toBe(true);

      const allSessions = getAll();
      expect(allSessions.length).toBe(1);
      expect(allSessions[0].session.name).toBe('New Session');
    });
  });
});

// Test cases for getByIds() function

describe('getByIds', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('basic retrieval', () => {
    it('should retrieve multiple sessions by their IDs', () => {
      // Save three sessions
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;
      const id3 = result3.data!.id;

      // Get sessions 1 and 3
      const sessions = getByIds([id1, id3]);

      expect(sessions.length).toBe(2);

      const sessionIds = sessions.map(s => s.id);
      expect(sessionIds).toContain(id1);
      expect(sessionIds).toContain(id3);
      expect(sessionIds).not.toContain(id2);
    });

    it('should retrieve a single session when array has one ID', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      save(session2);

      const id1 = result1.data!.id;

      const sessions = getByIds([id1]);

      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(id1);
      expect(sessions[0].session.name).toBe('Session 1');
    });

    it('should retrieve all sessions when all IDs are provided', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });
      const session3 = createTestSessionInput({ name: 'Session 3' });

      const result1 = save(session1);
      const result2 = save(session2);
      const result3 = save(session3);

      const allIds = [result1.data!.id, result2.data!.id, result3.data!.id];

      const sessions = getByIds(allIds);

      expect(sessions.length).toBe(3);
      const sessionIds = sessions.map(s => s.id);
      expect(sessionIds).toContain(allIds[0]);
      expect(sessionIds).toContain(allIds[1]);
      expect(sessionIds).toContain(allIds[2]);
    });

    it('should return the correct session data for retrieved sessions', () => {
      const session1 = createTestSessionInput({
        name: 'Mining Session',
        type: 'MINING',
        totalRevenue: 5000,
        distributionMode: 'PERCENT',
      });

      const result1 = save(session1);
      const id1 = result1.data!.id;

      const sessions = getByIds([id1]);

      expect(sessions.length).toBe(1);
      expect(sessions[0].session.name).toBe('Mining Session');
      expect(sessions[0].session.type).toBe('MINING');
      expect(sessions[0].session.totalRevenue).toBe(5000);
      expect(sessions[0].session.distributionMode).toBe('PERCENT');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when provided empty ID array', () => {
      const session = createTestSessionInput({ name: 'Session' });
      save(session);

      const sessions = getByIds([]);

      expect(sessions.length).toBe(0);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should return empty array when storage is empty', () => {
      const sessions = getByIds(['some-id', 'another-id']);

      expect(sessions.length).toBe(0);
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should return empty array when no IDs match', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      save(session1);
      save(session2);

      const sessions = getByIds(['non-existent-id-1', 'non-existent-id-2']);

      expect(sessions.length).toBe(0);
    });

    it('should return only matching sessions when some IDs do not exist', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      const sessions = getByIds([id1, 'non-existent', id2, 'another-non-existent']);

      expect(sessions.length).toBe(2);
      const sessionIds = sessions.map(s => s.id);
      expect(sessionIds).toContain(id1);
      expect(sessionIds).toContain(id2);
    });

    it('should handle duplicate IDs in the input array', () => {
      const session = createTestSessionInput({ name: 'Session' });
      const result = save(session);
      const id = result.data!.id;

      // Provide the same ID multiple times
      const sessions = getByIds([id, id, id]);

      // Should still return only one session (no duplicates in result)
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(id);
    });
  });

  describe('sorting behavior', () => {
    it('should maintain sort order by updatedAt (most recent first)', () => {
      // Save sessions in sequence
      const session1 = createTestSessionInput({ name: 'First' });
      const result1 = save(session1);
      const id1 = result1.data!.id;
      const timestamp1 = result1.data!.updatedAt;

      const session2 = createTestSessionInput({ name: 'Second' });
      const result2 = save(session2);
      const id2 = result2.data!.id;

      const session3 = createTestSessionInput({ name: 'Third' });
      const result3 = save(session3);
      const id3 = result3.data!.id;
      const timestamp3 = result3.data!.updatedAt;

      // Get in different order than saved
      const sessions = getByIds([id1, id3]);

      // Should be sorted by updatedAt (most recent first)
      expect(sessions.length).toBe(2);

      // Verify sorting: first session should have updatedAt >= second session
      const time0 = new Date(sessions[0].updatedAt).getTime();
      const time1 = new Date(sessions[1].updatedAt).getTime();
      expect(time0).toBeGreaterThanOrEqual(time1);

      // If timestamps are different, verify order matches save order
      if (timestamp3 > timestamp1) {
        expect(sessions[0].id).toBe(id3);
        expect(sessions[1].id).toBe(id1);
      }
    });

    it('should sort by updatedAt even when IDs are provided in reverse order', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const result1 = save(session1);
      const id1 = result1.data!.id;

      const session2 = createTestSessionInput({ name: 'Session 2' });
      const result2 = save(session2);
      const id2 = result2.data!.id;

      const session3 = createTestSessionInput({ name: 'Session 3' });
      const result3 = save(session3);
      const id3 = result3.data!.id;

      // Provide IDs in reverse order of creation
      const sessions = getByIds([id3, id2, id1]);

      // Should still be sorted by updatedAt (most recent first)
      expect(sessions.length).toBe(3);

      // Verify sorting: each session's updatedAt should be >= next session's updatedAt
      const time0 = new Date(sessions[0].updatedAt).getTime();
      const time1 = new Date(sessions[1].updatedAt).getTime();
      const time2 = new Date(sessions[2].updatedAt).getTime();

      expect(time0).toBeGreaterThanOrEqual(time1);
      expect(time1).toBeGreaterThanOrEqual(time2);
    });
  });

  describe('data integrity', () => {
    it('should return complete SavedSession objects', () => {
      const session = createTestSessionInput({ name: 'Test Session' });
      const result = save(session);
      const id = result.data!.id;

      const sessions = getByIds([id]);

      expect(sessions.length).toBe(1);
      const retrieved = sessions[0];

      // Check SavedSession structure
      expect(retrieved).toHaveProperty('id');
      expect(retrieved).toHaveProperty('session');
      expect(retrieved).toHaveProperty('createdAt');
      expect(retrieved).toHaveProperty('updatedAt');

      // Check session data
      expect(retrieved.session).toHaveProperty('id');
      expect(retrieved.session).toHaveProperty('name');
      expect(retrieved.session).toHaveProperty('members');
    });

    it('should preserve all session properties', () => {
      const session = createTestSessionInput({
        name: 'Complete Session',
        type: 'SALVAGE',
        currency: 'aUEC',
        totalRevenue: 10000,
        distributionMode: 'ADJUSTABLE',
        taxEnabled: true,
        taxRate: 15,
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Captain', active: true, fixedPayout: 1000 },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true },
        ],
      });

      const result = save(session);
      const id = result.data!.id;

      const sessions = getByIds([id]);

      expect(sessions.length).toBe(1);
      const retrieved = sessions[0].session;

      expect(retrieved.name).toBe('Complete Session');
      expect(retrieved.type).toBe('SALVAGE');
      expect(retrieved.currency).toBe('aUEC');
      expect(retrieved.totalRevenue).toBe(10000);
      expect(retrieved.distributionMode).toBe('ADJUSTABLE');
      expect(retrieved.taxEnabled).toBe(true);
      expect(retrieved.taxRate).toBe(15);
      expect(retrieved.members.length).toBe(2);
      expect(retrieved.members[0].handle).toBe('Alice');
      expect(retrieved.members[0].role).toBe('Captain');
      expect(retrieved.members[0].fixedPayout).toBe(1000);
    });

    it('should preserve timestamps correctly', () => {
      const session = createTestSessionInput({ name: 'Session' });
      const result = save(session);
      const id = result.data!.id;

      const createdAt = result.data!.createdAt;
      const updatedAt = result.data!.updatedAt;

      const sessions = getByIds([id]);

      expect(sessions.length).toBe(1);
      expect(sessions[0].createdAt).toBe(createdAt);
      expect(sessions[0].updatedAt).toBe(updatedAt);
    });

    it('should filter out corrupt data and return only valid sessions', () => {
      // Save valid sessions
      const session1 = createTestSessionInput({ name: 'Valid 1' });
      const session2 = createTestSessionInput({ name: 'Valid 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      // Manually corrupt the storage by adding invalid data
      const allSessions = getAll();
      const corruptData = [
        ...allSessions,
        { id: 'corrupt-id', invalid: 'data' }, // This doesn't match SavedSession schema
      ];
      localStorage.setItem('sc-payslip-sessions', JSON.stringify(corruptData));

      // getByIds should filter out corrupt data
      const sessions = getByIds([id1, id2, 'corrupt-id']);

      // Should only return the two valid sessions
      expect(sessions.length).toBe(2);
      const sessionIds = sessions.map(s => s.id);
      expect(sessionIds).toContain(id1);
      expect(sessionIds).toContain(id2);
      expect(sessionIds).not.toContain('corrupt-id');
    });
  });

  describe('interaction with other operations', () => {
    it('should work correctly after save operations', () => {
      const session1 = createTestSessionInput({ name: 'First' });
      const result1 = save(session1);
      const id1 = result1.data!.id;

      const sessions1 = getByIds([id1]);
      expect(sessions1.length).toBe(1);

      // Save another session
      const session2 = createTestSessionInput({ name: 'Second' });
      const result2 = save(session2);
      const id2 = result2.data!.id;

      const sessions2 = getByIds([id1, id2]);
      expect(sessions2.length).toBe(2);
    });

    it('should work correctly after update operations', () => {
      const session = createTestSessionInput({ name: 'Original' });
      const result = save(session);
      const id = result.data!.id;

      // Update the session
      const updatedSession = createTestSessionInput({ id, name: 'Updated' });
      save(updatedSession);

      const sessions = getByIds([id]);

      expect(sessions.length).toBe(1);
      expect(sessions[0].session.name).toBe('Updated');
    });

    it('should return empty for deleted sessions', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      // Delete one session
      bulkDelete([id1]);

      // Try to get both sessions
      const sessions = getByIds([id1, id2]);

      // Should only get the non-deleted session
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe(id2);
    });

    it('should work correctly with getAll', () => {
      // Save multiple sessions
      const ids: string[] = [];
      for (let i = 0; i < 5; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        ids.push(result.data!.id);
      }

      // Get all sessions
      const allSessions = getAll();
      expect(allSessions.length).toBe(5);

      // Get subset by IDs
      const subset = getByIds([ids[1], ids[3]]);
      expect(subset.length).toBe(2);

      // Should be a subset of getAll results
      const allIds = allSessions.map(s => s.id);
      subset.forEach(session => {
        expect(allIds).toContain(session.id);
      });
    });

    it('should return empty array after clearAll', () => {
      const session1 = createTestSessionInput({ name: 'Session 1' });
      const session2 = createTestSessionInput({ name: 'Session 2' });

      const result1 = save(session1);
      const result2 = save(session2);

      const id1 = result1.data!.id;
      const id2 = result2.data!.id;

      // Clear all sessions
      clearAll();

      // Try to get sessions
      const sessions = getByIds([id1, id2]);

      expect(sessions.length).toBe(0);
    });

  });

  describe('performance considerations', () => {
    it('should handle large number of IDs efficiently', () => {
      // Save 100 sessions
      const ids: string[] = [];
      for (let i = 0; i < 100; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        ids.push(result.data!.id);
      }

      // Get first 50 by IDs
      const selectedIds = ids.slice(0, 50);
      const sessions = getByIds(selectedIds);

      expect(sessions.length).toBe(50);

      // Verify all returned sessions are in the selected IDs
      sessions.forEach(session => {
        expect(selectedIds).toContain(session.id);
      });
    });

    it('should handle querying all sessions efficiently', () => {
      // Save 50 sessions
      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        const session = createTestSessionInput({ name: `Session ${i}` });
        const result = save(session);
        ids.push(result.data!.id);
      }

      // Get all by IDs
      const sessions = getByIds(ids);

      expect(sessions.length).toBe(50);
    });
  });
});
