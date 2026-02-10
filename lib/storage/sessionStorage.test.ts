import { duplicate, save, getAll, getByIds, clearAll, bulkDelete } from './sessionStorage';
import type { SessionInput, SavedSession } from '../types';

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

// Test cases for duplicate() function

describe('duplicate', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('basic duplication', () => {
    it('should create a copy of an existing session', () => {
      // Save original session
      const original = createTestSessionInput({ name: 'Original Session' });
      const saveResult = save(original);
      expect(saveResult.success).toBe(true);
      const originalId = saveResult.data!.id;

      // Duplicate the session
      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.session.name).toBe('Original Session (Copy)');
    });

    it('should generate a new session ID for the duplicate', () => {
      const original = createTestSessionInput();
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.id).not.toBe(originalId);
      expect(result.data!.session.id).not.toBe(originalId);
      expect(result.data!.id).toBe(result.data!.session.id);
    });

    it('should generate new IDs for all members', () => {
      const original = createTestSessionInput({
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      const duplicatedMembers = result.data!.session.members;

      // All member IDs should be new
      expect(duplicatedMembers[0].id).not.toBe('member-1');
      expect(duplicatedMembers[1].id).not.toBe('member-2');
      expect(duplicatedMembers[0].id).not.toBe(duplicatedMembers[1].id);

      // Member data should be preserved
      expect(duplicatedMembers[0].handle).toBe('Alice');
      expect(duplicatedMembers[1].handle).toBe('Bob');
    });

    it('should preserve session properties', () => {
      const original = createTestSessionInput({
        type: 'MINING',
        currency: 'aUEC',
        totalRevenue: 5000,
        distributionMode: 'PERCENT',
        taxEnabled: true,
        taxRate: 10,
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      const duplicated = result.data!.session;
      expect(duplicated.type).toBe('MINING');
      expect(duplicated.currency).toBe('aUEC');
      expect(duplicated.totalRevenue).toBe(5000);
      expect(duplicated.distributionMode).toBe('PERCENT');
      expect(duplicated.taxEnabled).toBe(true);
      expect(duplicated.taxRate).toBe(10);
    });

    it('should set new createdAt and updatedAt timestamps', () => {
      const original = createTestSessionInput();
      const saveResult = save(original);
      const originalId = saveResult.data!.id;
      const originalCreatedAt = saveResult.data!.createdAt;

      // Small delay to ensure different timestamp
      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      // Timestamps should be valid ISO strings
      expect(() => new Date(result.data!.createdAt)).not.toThrow();
      expect(() => new Date(result.data!.updatedAt)).not.toThrow();
      // createdAt and updatedAt should be the same for a new duplicate
      expect(result.data!.createdAt).toBe(result.data!.updatedAt);
    });

    it('should add the duplicated session to storage', () => {
      const original = createTestSessionInput();
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);
      expect(result.success).toBe(true);

      const allSessions = getAll();
      expect(allSessions.length).toBe(2);
      expect(allSessions.some(s => s.id === originalId)).toBe(true);
      expect(allSessions.some(s => s.id === result.data!.id)).toBe(true);
    });
  });

  describe('name handling', () => {
    it('should append "(Copy)" suffix to the name', () => {
      const original = createTestSessionInput({ name: 'My Session' });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.name).toBe('My Session (Copy)');
    });

    it('should truncate name if it exceeds max length with suffix', () => {
      // Max name length is 128, "(Copy)" is 7 characters
      const longName = 'A'.repeat(125); // 125 + 7 = 132, exceeds 128
      const original = createTestSessionInput({ name: longName });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      const expectedName = 'A'.repeat(121) + ' (Copy)'; // 121 + 7 = 128
      expect(result.data!.session.name).toBe(expectedName);
      expect(result.data!.session.name.length).toBe(128);
    });

    it('should not truncate name if it fits within max length', () => {
      const name = 'A'.repeat(100); // 100 + 7 = 107, under 128
      const original = createTestSessionInput({ name });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.name).toBe(name + ' (Copy)');
    });
  });

  describe('expense handling without copyExpenses flag', () => {
    it('should not copy shared expenses by default', () => {
      const original = createTestSessionInput({
        sharedExpenses: [
          { id: 'expense-1', label: 'Fuel', amount: 100 },
          { id: 'expense-2', label: 'Repairs', amount: 200 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.sharedExpenses).toBeUndefined();
    });

    it('should not copy individual expenses by default', () => {
      const original = createTestSessionInput({
        individualExpenses: [
          { id: 'expense-1', memberId: 'member-1', label: 'Personal Repair', amount: 50 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.individualExpenses).toBeUndefined();
    });
  });

  describe('expense handling with copyExpenses flag', () => {
    it('should copy shared expenses when copyExpenses is true', () => {
      const original = createTestSessionInput({
        sharedExpenses: [
          { id: 'expense-1', label: 'Fuel', amount: 100 },
          { id: 'expense-2', label: 'Repairs', amount: 200 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      expect(result.data!.session.sharedExpenses).toBeDefined();
      expect(result.data!.session.sharedExpenses!.length).toBe(2);

      // Check expense data is preserved
      expect(result.data!.session.sharedExpenses![0].label).toBe('Fuel');
      expect(result.data!.session.sharedExpenses![0].amount).toBe(100);
      expect(result.data!.session.sharedExpenses![1].label).toBe('Repairs');
      expect(result.data!.session.sharedExpenses![1].amount).toBe(200);
    });

    it('should generate new IDs for copied shared expenses', () => {
      const original = createTestSessionInput({
        sharedExpenses: [
          { id: 'expense-1', label: 'Fuel', amount: 100 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      expect(result.data!.session.sharedExpenses![0].id).not.toBe('expense-1');
    });

    it('should clear participantIds in shared expenses (v1 behavior)', () => {
      const original = createTestSessionInput({
        sharedExpenses: [
          { id: 'expense-1', label: 'Fuel', amount: 100, participantIds: ['member-1', 'member-2'] },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      expect(result.data!.session.sharedExpenses![0].participantIds).toBeUndefined();
    });

    it('should copy individual expenses when copyExpenses is true', () => {
      const original = createTestSessionInput({
        individualExpenses: [
          { id: 'expense-1', memberId: 'member-1', label: 'Personal Repair', amount: 50 },
          { id: 'expense-2', memberId: 'member-2', label: 'Ammo', amount: 75 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      expect(result.data!.session.individualExpenses).toBeDefined();
      expect(result.data!.session.individualExpenses!.length).toBe(2);

      // Check expense data is preserved
      expect(result.data!.session.individualExpenses![0].label).toBe('Personal Repair');
      expect(result.data!.session.individualExpenses![0].amount).toBe(50);
      expect(result.data!.session.individualExpenses![1].label).toBe('Ammo');
      expect(result.data!.session.individualExpenses![1].amount).toBe(75);
    });

    it('should generate new IDs for copied individual expenses', () => {
      const original = createTestSessionInput({
        individualExpenses: [
          { id: 'expense-1', memberId: 'member-1', label: 'Personal Repair', amount: 50 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      expect(result.data!.session.individualExpenses![0].id).not.toBe('expense-1');
    });

    it('should remap memberIds in individual expenses to new member IDs', () => {
      const original = createTestSessionInput({
        members: [
          { id: 'member-1', handle: 'Alice', role: 'Member', active: true },
          { id: 'member-2', handle: 'Bob', role: 'Member', active: true },
        ],
        individualExpenses: [
          { id: 'expense-1', memberId: 'member-1', label: 'Alice Expense', amount: 50 },
          { id: 'expense-2', memberId: 'member-2', label: 'Bob Expense', amount: 75 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);

      // Get the new member IDs
      const duplicatedMembers = result.data!.session.members;
      const aliceNewId = duplicatedMembers.find(m => m.handle === 'Alice')!.id;
      const bobNewId = duplicatedMembers.find(m => m.handle === 'Bob')!.id;

      // Individual expenses should reference the new member IDs
      const aliceExpense = result.data!.session.individualExpenses!.find(e => e.label === 'Alice Expense');
      const bobExpense = result.data!.session.individualExpenses!.find(e => e.label === 'Bob Expense');

      expect(aliceExpense!.memberId).toBe(aliceNewId);
      expect(bobExpense!.memberId).toBe(bobNewId);
    });

    it('should handle empty expense arrays', () => {
      const original = createTestSessionInput({
        sharedExpenses: [],
        individualExpenses: [],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      // Empty arrays should not be copied
      expect(result.data!.session.sharedExpenses).toBeUndefined();
      expect(result.data!.session.individualExpenses).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should return error if session not found', () => {
      const result = duplicate('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('should return error if session ID is empty', () => {
      const result = duplicate('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('should handle quota exceeded error', () => {
      const original = createTestSessionInput();
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = localStorageMock.setItem;
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem = () => {
        throw quotaError;
      };

      const result = duplicate(originalId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage quota exceeded. Please export and delete old sessions.');

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle generic errors', () => {
      const original = createTestSessionInput();
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      // Mock localStorage.setItem to throw generic error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('Some error');
      };

      const result = duplicate(originalId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Some error');

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('member property preservation', () => {
    it('should preserve all member properties', () => {
      const original = createTestSessionInput({
        members: [
          {
            id: 'member-1',
            handle: 'Alice',
            role: 'Captain',
            active: true,
            revenue: 500,
            investment: 100,
            percentShare: 60,
            fixedBonus: 50,
            fixedPayout: null,
          },
          {
            id: 'member-2',
            handle: 'Bob',
            role: 'Crew',
            active: false,
            revenue: 300,
            investment: 0,
            percentShare: 40,
            fixedBonus: null,
            fixedPayout: 200,
          },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      const duplicatedMembers = result.data!.session.members;

      const alice = duplicatedMembers.find(m => m.handle === 'Alice')!;
      expect(alice.role).toBe('Captain');
      expect(alice.active).toBe(true);
      expect(alice.revenue).toBe(500);
      expect(alice.investment).toBe(100);
      expect(alice.percentShare).toBe(60);
      expect(alice.fixedBonus).toBe(50);
      expect(alice.fixedPayout).toBeNull();

      const bob = duplicatedMembers.find(m => m.handle === 'Bob')!;
      expect(bob.role).toBe('Crew');
      expect(bob.active).toBe(false);
      expect(bob.revenue).toBe(300);
      expect(bob.investment).toBe(0);
      expect(bob.percentShare).toBe(40);
      expect(bob.fixedBonus).toBeNull();
      expect(bob.fixedPayout).toBe(200);
    });
  });

  describe('edge cases', () => {
    it('should handle session with no members', () => {
      const original = createTestSessionInput({ members: [] });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.members.length).toBe(0);
    });

    it('should handle session with single member', () => {
      const original = createTestSessionInput({
        members: [{ id: 'member-1', handle: 'Solo', role: 'Member', active: true }],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.members.length).toBe(1);
      expect(result.data!.session.members[0].handle).toBe('Solo');
      expect(result.data!.session.members[0].id).not.toBe('member-1');
    });

    it('should handle session with many members', () => {
      const members = Array.from({ length: 20 }, (_, i) => ({
        id: `member-${i}`,
        handle: `Member${i}`,
        role: 'Crew',
        active: true,
      }));
      const original = createTestSessionInput({ members });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.members.length).toBe(20);

      // All member IDs should be unique
      const newIds = new Set(result.data!.session.members.map(m => m.id));
      expect(newIds.size).toBe(20);

      // No original IDs should be present
      for (const member of result.data!.session.members) {
        expect(member.id).not.toMatch(/^member-\d+$/);
      }
    });

    it('should handle duplicating the same session multiple times', () => {
      const original = createTestSessionInput({ name: 'Original' });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result1 = duplicate(originalId);
      const result2 = duplicate(originalId);
      const result3 = duplicate(originalId);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // All duplicates should have unique IDs
      expect(result1.data!.id).not.toBe(result2.data!.id);
      expect(result2.data!.id).not.toBe(result3.data!.id);
      expect(result1.data!.id).not.toBe(result3.data!.id);

      // All should have the same name
      expect(result1.data!.session.name).toBe('Original (Copy)');
      expect(result2.data!.session.name).toBe('Original (Copy)');
      expect(result3.data!.session.name).toBe('Original (Copy)');

      // Storage should have 4 sessions total
      const allSessions = getAll();
      expect(allSessions.length).toBe(4);
    });

    it('should handle members without ID field', () => {
      const original = createTestSessionInput({
        members: [
          { handle: 'NoId1', role: 'Member', active: true },
          { handle: 'NoId2', role: 'Member', active: true },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId);

      expect(result.success).toBe(true);
      expect(result.data!.session.members.length).toBe(2);
      // New IDs should be generated
      expect(result.data!.session.members[0].id).toBeDefined();
      expect(result.data!.session.members[1].id).toBeDefined();
    });

    it('should handle individual expense with unknown member ID when copying', () => {
      const original = createTestSessionInput({
        individualExpenses: [
          { id: 'expense-1', memberId: 'unknown-member', label: 'Orphan Expense', amount: 50 },
        ],
      });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      const result = duplicate(originalId, true);

      expect(result.success).toBe(true);
      // The expense should still be copied, with original memberId if not mapped
      expect(result.data!.session.individualExpenses).toBeDefined();
      expect(result.data!.session.individualExpenses![0].memberId).toBe('unknown-member');
    });
  });
});

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

    it('should work with duplicate operation', () => {
      const original = createTestSessionInput({ name: 'Original' });
      const saveResult = save(original);
      const originalId = saveResult.data!.id;

      // Duplicate the session
      const duplicateResult = duplicate(originalId);
      expect(duplicateResult.success).toBe(true);
      const duplicateId = duplicateResult.data!.id;

      // Get both sessions
      const sessions = getByIds([originalId, duplicateId]);

      expect(sessions.length).toBe(2);
      const sessionNames = sessions.map(s => s.session.name);
      expect(sessionNames).toContain('Original');
      expect(sessionNames).toContain('Original (Copy)');
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
