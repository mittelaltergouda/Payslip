import { describe, it, expect } from 'vitest';
import {
  memberSchema,
  sharedExpenseSchema,
  individualExpenseSchema,
  sessionSchema,
  sessionIdParamSchema
} from './validation';

describe('memberSchema', () => {
  describe('handle validation', () => {
    it('should accept valid handles with letters and numbers', () => {
      const validMember = {
        handle: 'Player123',
        revenue: 1000,
        investment: 500
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should accept handles with spaces, hyphens, underscores, periods, and apostrophes', () => {
      const validHandles = [
        'John Doe',
        'Player-123',
        'User_Name',
        'Dr.Smith',
        "O'Brien",
        'José García' // Unicode characters
      ];

      validHandles.forEach(handle => {
        const result = memberSchema.safeParse({ handle, revenue: 0, investment: 0 });
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty handles', () => {
      const invalidMember = {
        handle: '',
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should reject handles with only whitespace', () => {
      const invalidMember = {
        handle: '   ',
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be only whitespace');
      }
    });

    it('should reject handles exceeding 64 characters', () => {
      const longHandle = 'a'.repeat(65);
      const invalidMember = {
        handle: longHandle,
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 64 characters');
      }
    });

    it('should accept handle at exactly 64 characters', () => {
      const exactHandle = 'a'.repeat(64);
      const validMember = {
        handle: exactHandle,
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject handles with invalid characters', () => {
      const invalidHandles = [
        'User@Name',
        'Player#123',
        'Test$User',
        'Name&Co',
        'User*Name'
      ];

      invalidHandles.forEach(handle => {
        const result = memberSchema.safeParse({ handle, revenue: 0, investment: 0 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('invalid characters');
        }
      });
    });
  });

  describe('role validation', () => {
    it('should accept optional role field', () => {
      const memberWithoutRole = {
        handle: 'Player',
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(memberWithoutRole);
      expect(result.success).toBe(true);
    });

    it('should accept role up to 64 characters', () => {
      const validMember = {
        handle: 'Player',
        role: 'a'.repeat(64),
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject role exceeding 64 characters', () => {
      const invalidMember = {
        handle: 'Player',
        role: 'a'.repeat(65),
        revenue: 0,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 64 characters');
      }
    });
  });

  describe('revenue validation', () => {
    it('should accept valid non-negative integer revenue', () => {
      const validMember = {
        handle: 'Player',
        revenue: 1000,
        investment: 0
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should default revenue to 0 if not provided', () => {
      const member = {
        handle: 'Player',
        investment: 0
      };
      const result = memberSchema.safeParse(member);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.revenue).toBe(0);
      }
    });

    it('should reject negative revenue', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: -100,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer revenue', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 1000.5,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept revenue at max value (2147483647)', () => {
      const validMember = {
        handle: 'Player',
        revenue: 2147483647,
        investment: 0
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject revenue exceeding max value', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 2147483648,
        investment: 0
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });

  describe('investment validation', () => {
    it('should accept valid non-negative integer investment', () => {
      const validMember = {
        handle: 'Player',
        revenue: 1000,
        investment: 500
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should default investment to 0 if not provided', () => {
      const member = {
        handle: 'Player',
        revenue: 1000
      };
      const result = memberSchema.safeParse(member);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.investment).toBe(0);
      }
    });

    it('should reject negative investment', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 1000,
        investment: -100
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer investment', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 1000,
        investment: 500.5
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept investment at max value (2147483647)', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 2147483647
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject investment exceeding max value', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 2147483648
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });

  describe('percentShare validation', () => {
    it('should accept valid percent share between 0 and 100', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: 50
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should accept percentShare of 0', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: 0
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should accept percentShare of 100', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: 100
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject negative percentShare', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: -10
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject percentShare exceeding 100', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: 101
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 100%');
      }
    });

    it('should accept optional percentShare (null or undefined)', () => {
      const memberWithNull = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        percentShare: null
      };
      const resultNull = memberSchema.safeParse(memberWithNull);
      expect(resultNull.success).toBe(true);

      const memberWithUndefined = {
        handle: 'Player',
        revenue: 0,
        investment: 0
      };
      const resultUndefined = memberSchema.safeParse(memberWithUndefined);
      expect(resultUndefined.success).toBe(true);
    });
  });

  describe('fixedBonus validation', () => {
    it('should accept valid non-negative integer fixedBonus', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedBonus: 100
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject negative fixedBonus', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedBonus: -100
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer fixedBonus', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedBonus: 100.5
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept fixedBonus at max value', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedBonus: 2147483647
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject fixedBonus exceeding max value', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedBonus: 2147483648
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });

  describe('fixedPayout validation', () => {
    it('should accept valid non-negative integer fixedPayout', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedPayout: 500
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject negative fixedPayout', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedPayout: -500
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer fixedPayout', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedPayout: 500.5
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept fixedPayout at max value', () => {
      const validMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedPayout: 2147483647
      };
      const result = memberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });

    it('should reject fixedPayout exceeding max value', () => {
      const invalidMember = {
        handle: 'Player',
        revenue: 0,
        investment: 0,
        fixedPayout: 2147483648
      };
      const result = memberSchema.safeParse(invalidMember);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });
});

describe('sharedExpenseSchema', () => {
  describe('label validation', () => {
    it('should accept valid label', () => {
      const validExpense = {
        label: 'Fuel Cost',
        amount: 100
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject empty label', () => {
      const invalidExpense = {
        label: '',
        amount: 100
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should accept label at exactly 128 characters', () => {
      const validExpense = {
        label: 'a'.repeat(128),
        amount: 100
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject label exceeding 128 characters', () => {
      const invalidExpense = {
        label: 'a'.repeat(129),
        amount: 100
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 128 characters');
      }
    });
  });

  describe('amount validation', () => {
    it('should accept valid non-negative integer amount', () => {
      const validExpense = {
        label: 'Fuel',
        amount: 500
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should accept amount of 0', () => {
      const validExpense = {
        label: 'Free Service',
        amount: 0
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidExpense = {
        label: 'Refund',
        amount: -100
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer amount', () => {
      const invalidExpense = {
        label: 'Fuel',
        amount: 100.5
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept amount at max value', () => {
      const validExpense = {
        label: 'Big Expense',
        amount: 2147483647
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject amount exceeding max value', () => {
      const invalidExpense = {
        label: 'Too Big',
        amount: 2147483648
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });

  describe('participantIds validation', () => {
    it('should accept optional participantIds array', () => {
      const expenseWithoutParticipants = {
        label: 'Shared Fuel',
        amount: 100
      };
      const result = sharedExpenseSchema.safeParse(expenseWithoutParticipants);
      expect(result.success).toBe(true);
    });

    it('should accept non-empty participantIds array', () => {
      const validExpense = {
        label: 'Fuel',
        amount: 100,
        participantIds: ['member-1', 'member-2']
      };
      const result = sharedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject empty participantIds array', () => {
      const invalidExpense = {
        label: 'Fuel',
        amount: 100,
        participantIds: []
      };
      const result = sharedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one member');
      }
    });
  });
});

describe('individualExpenseSchema', () => {
  describe('memberId validation', () => {
    it('should accept valid memberId', () => {
      const validExpense = {
        memberId: 'member-123',
        label: 'Repair',
        amount: 100
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject empty memberId', () => {
      const invalidExpense = {
        memberId: '',
        label: 'Repair',
        amount: 100
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });
  });

  describe('label validation', () => {
    it('should accept valid label', () => {
      const validExpense = {
        memberId: 'member-1',
        label: 'Ship Repair',
        amount: 200
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject empty label', () => {
      const invalidExpense = {
        memberId: 'member-1',
        label: '',
        amount: 200
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should accept label at exactly 128 characters', () => {
      const validExpense = {
        memberId: 'member-1',
        label: 'a'.repeat(128),
        amount: 200
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject label exceeding 128 characters', () => {
      const invalidExpense = {
        memberId: 'member-1',
        label: 'a'.repeat(129),
        amount: 200
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 128 characters');
      }
    });
  });

  describe('amount validation', () => {
    it('should accept valid non-negative integer amount', () => {
      const validExpense = {
        memberId: 'member-1',
        label: 'Repair',
        amount: 300
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should accept amount of 0', () => {
      const validExpense = {
        memberId: 'member-1',
        label: 'Free Repair',
        amount: 0
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidExpense = {
        memberId: 'member-1',
        label: 'Refund',
        amount: -100
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer amount', () => {
      const invalidExpense = {
        memberId: 'member-1',
        label: 'Repair',
        amount: 300.75
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept amount at max value', () => {
      const validExpense = {
        memberId: 'member-1',
        label: 'Big Repair',
        amount: 2147483647
      };
      const result = individualExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it('should reject amount exceeding max value', () => {
      const invalidExpense = {
        memberId: 'member-1',
        label: 'Too Big',
        amount: 2147483648
      };
      const result = individualExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });
});

describe('sessionSchema', () => {
  describe('basic session validation', () => {
    it('should accept valid session with minimum required fields', () => {
      const validSession = {
        name: 'Trading Run',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [
          { handle: 'Player1', revenue: 0, investment: 0 }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should apply default values for optional fields', () => {
      const session = {
        name: 'Test Session',
        type: 'MINING',
        distributionMode: 'EQUAL',
        members: [
          { handle: 'Player1', revenue: 0, investment: 0 }
        ]
      };
      const result = sessionSchema.safeParse(session);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('aUEC');
        expect(result.data.totalRevenue).toBe(0);
        expect(result.data.taxEnabled).toBe(true);
        expect(result.data.taxRate).toBe(0.005);
      }
    });
  });

  describe('name validation', () => {
    it('should accept valid session name', () => {
      const validSession = {
        name: 'Mining Op 2024',
        type: 'MINING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject empty session name', () => {
      const invalidSession = {
        name: '',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should accept name at exactly 128 characters', () => {
      const validSession = {
        name: 'a'.repeat(128),
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject name exceeding 128 characters', () => {
      const invalidSession = {
        name: 'a'.repeat(129),
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 128 characters');
      }
    });
  });

  describe('type validation', () => {
    it('should accept all valid session types', () => {
      const validTypes = ['TRADING', 'PIRACY', 'SALVAGE', 'MINING', 'BOUNTY', 'OTHER'];

      validTypes.forEach(type => {
        const session = {
          name: 'Test',
          type,
          distributionMode: 'EQUAL',
          members: [{ handle: 'Player', revenue: 0, investment: 0 }]
        };
        const result = sessionSchema.safeParse(session);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid session type', () => {
      const invalidSession = {
        name: 'Test',
        type: 'INVALID_TYPE',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid session type');
      }
    });
  });

  describe('totalRevenue validation', () => {
    it('should accept valid non-negative integer totalRevenue', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        totalRevenue: 10000,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject negative totalRevenue', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        totalRevenue: -1000,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject non-integer totalRevenue', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        totalRevenue: 1000.5,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should accept totalRevenue at max value', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        totalRevenue: 2147483647,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject totalRevenue exceeding max value', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        totalRevenue: 2147483648,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 2147483647');
      }
    });
  });

  describe('distributionMode validation', () => {
    it('should accept all valid distribution modes', () => {
      // EQUAL mode - no percentShares needed
      const equalSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const equalResult = sessionSchema.safeParse(equalSession);
      expect(equalResult.success).toBe(true);

      // PERCENT mode - requires percentShares summing to 100
      const percentSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [{ handle: 'Player', revenue: 0, investment: 0, percentShare: 100, active: true }]
      };
      const percentResult = sessionSchema.safeParse(percentSession);
      expect(percentResult.success).toBe(true);

      // ADJUSTABLE mode - no strict requirements
      const adjustableSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const adjustableResult = sessionSchema.safeParse(adjustableSession);
      expect(adjustableResult.success).toBe(true);
    });

    it('should reject invalid distribution mode', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'INVALID_MODE',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid distribution mode');
      }
    });
  });

  describe('taxRate validation', () => {
    it('should accept valid tax rate between 0 and 1', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        taxRate: 0.15,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should accept tax rate of 0', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        taxRate: 0,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should accept tax rate of 1 (100%)', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        taxRate: 1,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject negative tax rate', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        taxRate: -0.1,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });

    it('should reject tax rate exceeding 1', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        taxRate: 1.5,
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 100%');
      }
    });
  });

  describe('members validation', () => {
    it('should accept session with single member', () => {
      const validSession = {
        name: 'Solo',
        type: 'MINING',
        distributionMode: 'EQUAL',
        members: [{ handle: 'Player', revenue: 0, investment: 0 }]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should accept session with multiple members', () => {
      const validSession = {
        name: 'Crew',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [
          { handle: 'Player1', revenue: 0, investment: 0 },
          { handle: 'Player2', revenue: 0, investment: 0 },
          { handle: 'Player3', revenue: 0, investment: 0 }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject session with no members', () => {
      const invalidSession = {
        name: 'Empty',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: []
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one member');
      }
    });
  });

  describe('PERCENT mode custom refinements', () => {
    it('should accept valid PERCENT mode with percentShares summing to 100', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 60, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, percentShare: 40, active: true }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should accept PERCENT mode with floating point precision tolerance', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 33.33, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, percentShare: 33.33, active: true },
          { handle: 'Charlie', revenue: 0, investment: 0, percentShare: 33.34, active: true }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject PERCENT mode when percentShares do not sum to 100', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 50, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, percentShare: 40, active: true }
        ]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must equal 100%');
      }
    });

    it('should reject PERCENT mode when active member missing percentShare', () => {
      const invalidSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 100, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, active: true }
        ]
      };
      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must have a percentShare value');
      }
    });

    it('should accept PERCENT mode with inactive members without percentShares', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'PERCENT',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 100, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, active: false }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should not validate percentShare sum for EQUAL mode', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'EQUAL',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 50, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, percentShare: 30, active: true }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should not validate percentShare sum for ADJUSTABLE mode', () => {
      const validSession = {
        name: 'Test',
        type: 'TRADING',
        distributionMode: 'ADJUSTABLE',
        members: [
          { handle: 'Alice', revenue: 0, investment: 0, percentShare: 60, active: true },
          { handle: 'Bob', revenue: 0, investment: 0, percentShare: 30, active: true }
        ]
      };
      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });
  });

  describe('complex session validation', () => {
    it('should accept session with all optional fields populated', () => {
      const complexSession = {
        id: 'session-123',
        name: 'Complex Trading Run',
        type: 'TRADING',
        currency: 'aUEC',
        totalRevenue: 50000,
        distributionMode: 'PERCENT',
        taxEnabled: true,
        taxRate: 0.005,
        members: [
          {
            id: 'member-1',
            handle: 'Captain',
            role: 'Pilot',
            active: true,
            revenue: 30000,
            investment: 10000,
            percentShare: 60,
            fixedBonus: 1000,
            fixedPayout: null
          },
          {
            id: 'member-2',
            handle: 'Engineer',
            role: 'Crew',
            active: true,
            revenue: 20000,
            investment: 5000,
            percentShare: 40,
            fixedBonus: null,
            fixedPayout: null
          }
        ],
        sharedExpenses: [
          {
            id: 'expense-1',
            label: 'Fuel',
            amount: 2000,
            participantIds: ['member-1', 'member-2']
          }
        ],
        individualExpenses: [
          {
            id: 'expense-2',
            memberId: 'member-1',
            label: 'Ship Repair',
            amount: 1500
          }
        ]
      };
      const result = sessionSchema.safeParse(complexSession);
      expect(result.success).toBe(true);
    });
  });
});

describe('sessionIdParamSchema', () => {
  describe('UUID validation', () => {
    it('should accept valid UUID v4 format', () => {
      const validParam = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = sessionIdParamSchema.safeParse(validParam);
      expect(result.success).toBe(true);
    });

    it('should accept valid UUID with different variations', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      ];

      validUUIDs.forEach(id => {
        const result = sessionIdParamSchema.safeParse({ id });
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty string', () => {
      const invalidParam = {
        id: ''
      };
      const result = sessionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid');
      }
    });

    it('should reject non-UUID string', () => {
      const invalidParam = {
        id: 'not-a-uuid'
      };
      const result = sessionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid session ID format');
        expect(result.error.issues[0].message).toContain('must be a valid UUID');
      }
    });

    it('should reject UUID-like string with invalid format', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456-42661417400',  // Too short
        '123e4567-e89b-12d3-a456-4266141740000', // Too long
        '123e4567-e89b-12d3-a456-42661417400g',  // Invalid character
        '123e4567e89b12d3a456426614174000',      // Missing hyphens
        '123e4567-e89b-12d3-a456'                // Incomplete
      ];

      invalidUUIDs.forEach(id => {
        const result = sessionIdParamSchema.safeParse({ id });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid session ID format');
        }
      });
    });

    it('should reject numeric session ID', () => {
      const invalidParam = {
        id: '12345'
      };
      const result = sessionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid session ID format');
      }
    });

    it('should reject random string', () => {
      const invalidParam = {
        id: 'abc123xyz'
      };
      const result = sessionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid session ID format');
      }
    });

    it('should reject special characters', () => {
      const invalidParam = {
        id: '@#$%^&*()'
      };
      const result = sessionIdParamSchema.safeParse(invalidParam);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid session ID format');
      }
    });
  });
});
