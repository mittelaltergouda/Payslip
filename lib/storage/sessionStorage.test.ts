import { duplicate, save, getAll } from './sessionStorage';
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
      const _originalCreatedAt = saveResult.data!.createdAt;

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
