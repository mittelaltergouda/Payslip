import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as crewPresetStorage from '../../../lib/storage/crewPresetStorage';
import type { PresetMember, DistributionMode } from '../../../lib/types';

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

const createTestMembers = (overrides?: Partial<PresetMember>[]): PresetMember[] => [
  { handle: 'Alice', role: 'Captain', ...overrides?.[0] },
  { handle: 'Bob', role: 'Crew', ...overrides?.[1] },
];

// ============================================================================
// TESTS
// ============================================================================

describe('crewPresetStorage - savePreset()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should save a new preset to localStorage', () => {
    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Test Preset', members);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBeDefined();
    expect(result.data?.name).toBe('Test Preset');
    expect(result.data?.createdAt).toBeDefined();
    expect(result.data?.updatedAt).toBeDefined();
  });

  it('should assign an ID to a new preset', () => {
    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Test Preset', members);

    expect(result.success).toBe(true);
    expect(result.data?.id).toMatch(/^test-id-/);
  });

  it('should preserve all fields in saved preset', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', role: 'Captain', percentShare: 60 },
      { handle: 'Bob', role: 'Crew', percentShare: 40 },
    ];
    const distributionMode: DistributionMode = 'PERCENT';

    const result = crewPresetStorage.savePreset('Complex Preset', members, distributionMode);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Complex Preset');
    expect(result.data?.members.length).toBe(2);
    expect(result.data?.members[0].handle).toBe('Alice');
    expect(result.data?.members[0].role).toBe('Captain');
    expect(result.data?.members[0].percentShare).toBe(60);
    expect(result.data?.members[1].handle).toBe('Bob');
    expect(result.data?.members[1].role).toBe('Crew');
    expect(result.data?.members[1].percentShare).toBe(40);
    expect(result.data?.distributionMode).toBe('PERCENT');
  });

  it('should handle QuotaExceededError', () => {
    // Mock setItem to throw QuotaExceededError
    localStorageMock.setItem.mockImplementationOnce(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Test Preset', members);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage quota exceeded');
  });

  it('should handle generic errors', () => {
    // Mock setItem to throw a generic error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Generic storage error');
    });

    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Test Preset', members);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Generic storage error');
  });

  it('should save multiple presets', () => {
    const members1 = createTestMembers();
    const members2: PresetMember[] = [{ handle: 'Charlie', role: 'Pilot' }];

    crewPresetStorage.savePreset('Preset 1', members1);
    crewPresetStorage.savePreset('Preset 2', members2);

    const allPresets = crewPresetStorage.getAllPresets();
    expect(allPresets.length).toBe(2);
  });

  it('should save preset without distribution mode', () => {
    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Minimal Preset', members);

    expect(result.success).toBe(true);
    expect(result.data?.distributionMode).toBeUndefined();
  });

  it('should save preset with EQUAL distribution mode', () => {
    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Equal Preset', members, 'EQUAL');

    expect(result.success).toBe(true);
    expect(result.data?.distributionMode).toBe('EQUAL');
  });

  it('should save preset with ADJUSTABLE distribution mode', () => {
    const members = createTestMembers();
    const result = crewPresetStorage.savePreset('Adjustable Preset', members, 'ADJUSTABLE');

    expect(result.success).toBe(true);
    expect(result.data?.distributionMode).toBe('ADJUSTABLE');
  });
});

describe('crewPresetStorage - getAllPresets()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should return an empty array when no presets exist', () => {
    const presets = crewPresetStorage.getAllPresets();
    expect(presets).toEqual([]);
  });

  it('should return all saved presets', () => {
    const members1 = createTestMembers();
    const members2: PresetMember[] = [{ handle: 'Charlie' }];

    crewPresetStorage.savePreset('Preset 1', members1);
    crewPresetStorage.savePreset('Preset 2', members2);

    const presets = crewPresetStorage.getAllPresets();
    expect(presets.length).toBe(2);
  });

  it('should return presets sorted by most recent first', () => {
    vi.useFakeTimers();

    // Save presets with delays to ensure different timestamps
    const members = createTestMembers();
    crewPresetStorage.savePreset('First', members);

    // Wait a bit
    vi.advanceTimersByTime(100);

    crewPresetStorage.savePreset('Second', members);

    const presets = crewPresetStorage.getAllPresets();

    expect(presets.length).toBe(2);
    // Most recent should be first
    expect(presets[0].name).toBe('Second');
    expect(presets[1].name).toBe('First');

    vi.useRealTimers();
  });

  it('should filter out invalid data', () => {
    // Manually add valid preset first
    const members = createTestMembers();
    crewPresetStorage.savePreset('Valid Preset', members);

    // Add invalid data directly
    const corruptData = [
      { invalid: 'data' },
      { id: 'partial', name: 'Partial' }, // missing members, createdAt, updatedAt
    ];
    localStorageMock.setItem('sc-payslip-crew-presets', JSON.stringify(corruptData));

    const presets = crewPresetStorage.getAllPresets();

    // Should return empty array since all items are invalid
    expect(presets).toEqual([]);
  });

  it('should handle corrupt localStorage data gracefully', () => {
    // Set invalid JSON
    localStorageMock.setItem('sc-payslip-crew-presets', 'invalid json {]');

    const presets = crewPresetStorage.getAllPresets();
    expect(presets).toEqual([]);
  });

  it('should handle non-array data in localStorage', () => {
    // Set non-array data
    localStorageMock.setItem('sc-payslip-crew-presets', JSON.stringify({ not: 'an array' }));

    const presets = crewPresetStorage.getAllPresets();
    expect(presets).toEqual([]);
  });

  it('should handle localStorage unavailable', () => {
    // Mock getItem to throw an error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available');
    });

    const presets = crewPresetStorage.getAllPresets();
    expect(presets).toEqual([]);
  });

  it('should filter out presets with missing required fields', () => {
    // Add presets with missing required fields directly
    const mixedData = [
      {
        id: 'valid-1',
        name: 'Valid',
        members: [{ handle: 'Alice' }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'missing-name',
        members: [{ handle: 'Bob' }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'missing-members',
        name: 'No Members',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    localStorageMock.setItem('sc-payslip-crew-presets', JSON.stringify(mixedData));

    const presets = crewPresetStorage.getAllPresets();

    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe('Valid');
  });
});

describe('crewPresetStorage - deletePreset()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should delete a preset by ID', () => {
    const members = createTestMembers();
    const result1 = crewPresetStorage.savePreset('Preset 1', members);
    crewPresetStorage.savePreset('Preset 2', members);

    const deleteResult = crewPresetStorage.deletePreset(result1.data!.id);

    expect(deleteResult.success).toBe(true);

    const presets = crewPresetStorage.getAllPresets();
    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe('Preset 2');
  });

  it('should succeed even if preset ID does not exist', () => {
    const members = createTestMembers();
    crewPresetStorage.savePreset('Preset 1', members);

    const result = crewPresetStorage.deletePreset('non-existent-id');

    expect(result.success).toBe(true);

    const presets = crewPresetStorage.getAllPresets();
    expect(presets.length).toBe(1);
  });

  it('should handle errors during deletion', () => {
    const members = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Preset 1', members);

    // Mock setItem to throw an error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Failed to delete');
    });

    const result = crewPresetStorage.deletePreset(saveResult.data!.id);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to delete');
  });

  it('should delete all presets when called multiple times', () => {
    const members = createTestMembers();
    const result1 = crewPresetStorage.savePreset('Preset 1', members);
    const result2 = crewPresetStorage.savePreset('Preset 2', members);
    const result3 = crewPresetStorage.savePreset('Preset 3', members);

    crewPresetStorage.deletePreset(result1.data!.id);
    crewPresetStorage.deletePreset(result2.data!.id);
    crewPresetStorage.deletePreset(result3.data!.id);

    const presets = crewPresetStorage.getAllPresets();
    expect(presets.length).toBe(0);
  });

  it('should succeed when deleting from empty storage', () => {
    const result = crewPresetStorage.deletePreset('any-id');

    expect(result.success).toBe(true);
  });
});

describe('crewPresetStorage - updatePreset()', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should update preset name', () => {
    const members = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Original Name', members);

    const updateResult = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated Name',
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.name).toBe('Updated Name');
    expect(updateResult.data?.members).toEqual(members);
  });

  it('should update preset members', () => {
    const originalMembers = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Test Preset', originalMembers);

    const newMembers: PresetMember[] = [
      { handle: 'Charlie', role: 'Pilot' },
      { handle: 'Diana', role: 'Gunner' },
      { handle: 'Eve', role: 'Engineer' },
    ];

    const updateResult = crewPresetStorage.updatePreset(saveResult.data!.id, {
      members: newMembers,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.name).toBe('Test Preset');
    expect(updateResult.data?.members.length).toBe(3);
    expect(updateResult.data?.members[0].handle).toBe('Charlie');
  });

  it('should update both name and members', () => {
    const originalMembers = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Original', originalMembers);

    const newMembers: PresetMember[] = [{ handle: 'Solo', role: 'Captain' }];

    const updateResult = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated',
      members: newMembers,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.name).toBe('Updated');
    expect(updateResult.data?.members.length).toBe(1);
    expect(updateResult.data?.members[0].handle).toBe('Solo');
  });

  it('should handle non-existent preset', () => {
    const result = crewPresetStorage.updatePreset('non-existent-id', {
      name: 'Updated Name',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Preset not found');
  });

  it('should update updatedAt timestamp', () => {
    vi.useFakeTimers();

    const members = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Test Preset', members);
    const originalUpdatedAt = saveResult.data!.updatedAt;
    const originalCreatedAt = saveResult.data!.createdAt;

    // Wait a bit
    vi.advanceTimersByTime(1000);

    const updateResult = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated Name',
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.createdAt).toBe(originalCreatedAt);
    expect(updateResult.data?.updatedAt).not.toBe(originalUpdatedAt);

    vi.useRealTimers();
  });

  it('should handle QuotaExceededError during update', () => {
    const members = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Test Preset', members);

    // Mock setItem to throw QuotaExceededError
    localStorageMock.setItem.mockImplementationOnce(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const result = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated Name',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage quota exceeded');
  });

  it('should handle generic errors during update', () => {
    const members = createTestMembers();
    const saveResult = crewPresetStorage.savePreset('Test Preset', members);

    // Mock setItem to throw a generic error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Generic update error');
    });

    const result = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated Name',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Generic update error');
  });

  it('should preserve other fields when updating', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', role: 'Captain', percentShare: 60 },
    ];
    const saveResult = crewPresetStorage.savePreset('Test', members, 'PERCENT');

    const updateResult = crewPresetStorage.updatePreset(saveResult.data!.id, {
      name: 'Updated Test',
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.distributionMode).toBe('PERCENT');
    expect(updateResult.data?.members[0].percentShare).toBe(60);
  });
});

describe('crewPresetStorage - edge cases', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    idCounter = 0;
  });

  it('should handle rapid successive saves without data loss', () => {
    const members = createTestMembers();

    // Rapidly save 10 presets
    for (let i = 0; i < 10; i++) {
      crewPresetStorage.savePreset(`Preset ${i}`, members);
    }

    const savedPresets = crewPresetStorage.getAllPresets();
    expect(savedPresets.length).toBe(10);
  });

  it('should preserve data types during save and retrieve', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', role: 'Captain', percentShare: 50.5 },
      { handle: 'Bob', role: 'Crew', percentShare: null },
    ];

    crewPresetStorage.savePreset('Type Test', members, 'PERCENT');
    const retrieved = crewPresetStorage.getAllPresets()[0];

    expect(typeof retrieved.name).toBe('string');
    expect(typeof retrieved.id).toBe('string');
    expect(typeof retrieved.createdAt).toBe('string');
    expect(typeof retrieved.updatedAt).toBe('string');
    expect(Array.isArray(retrieved.members)).toBe(true);
    expect(typeof retrieved.members[0].handle).toBe('string');
    expect(typeof retrieved.members[0].role).toBe('string');
    expect(typeof retrieved.members[0].percentShare).toBe('number');
    expect(retrieved.members[1].percentShare).toBeNull();
    expect(retrieved.distributionMode).toBe('PERCENT');
  });

  it('should handle preset with minimal data', () => {
    const minimalMembers: PresetMember[] = [{ handle: 'Solo' }];

    const result = crewPresetStorage.savePreset('Minimal', minimalMembers);

    expect(result.success).toBe(true);
    expect(result.data?.members.length).toBe(1);
    expect(result.data?.members[0].handle).toBe('Solo');
    expect(result.data?.members[0].role).toBeUndefined();
    expect(result.data?.members[0].percentShare).toBeUndefined();
  });

  it('should handle preset with empty members array', () => {
    const result = crewPresetStorage.savePreset('Empty Crew', []);

    expect(result.success).toBe(true);
    expect(result.data?.members.length).toBe(0);
  });

  it('should handle preset with many members', () => {
    const manyMembers: PresetMember[] = Array.from({ length: 50 }, (_, i) => ({
      handle: `Member${i}`,
      role: `Role${i}`,
      percentShare: i,
    }));

    const result = crewPresetStorage.savePreset('Large Crew', manyMembers);

    expect(result.success).toBe(true);
    expect(result.data?.members.length).toBe(50);

    // Verify data integrity
    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.members.length).toBe(50);
    expect(retrieved.members[49].handle).toBe('Member49');
  });

  it('should handle special characters in preset name', () => {
    const members = createTestMembers();
    const specialName = "Test's \"Crew\" <>&";

    const result = crewPresetStorage.savePreset(specialName, members);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe(specialName);

    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.name).toBe(specialName);
  });

  it('should handle special characters in member handles', () => {
    const members: PresetMember[] = [
      { handle: "O'Brien", role: 'Captain' },
      { handle: 'User<script>', role: 'Crew' },
      { handle: '中文名字', role: 'Pilot' },
    ];

    const result = crewPresetStorage.savePreset('International Crew', members);

    expect(result.success).toBe(true);

    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.members[0].handle).toBe("O'Brien");
    expect(retrieved.members[1].handle).toBe('User<script>');
    expect(retrieved.members[2].handle).toBe('中文名字');
  });

  it('should maintain timestamp consistency', () => {
    vi.useFakeTimers();

    const members = createTestMembers();
    const result1 = crewPresetStorage.savePreset('Timestamp Test', members);

    const createdAt = result1.data?.createdAt;
    const updatedAt1 = result1.data?.updatedAt;

    expect(createdAt).toBe(updatedAt1);

    // Update the preset
    vi.advanceTimersByTime(1000);
    const result2 = crewPresetStorage.updatePreset(result1.data!.id, {
      name: 'Updated',
    });

    expect(result2.data?.createdAt).toBe(createdAt);
    expect(result2.data?.updatedAt).not.toBe(updatedAt1);

    vi.useRealTimers();
  });

  it('should handle concurrent operations correctly', () => {
    const members = createTestMembers();

    // Save initial presets
    const result1 = crewPresetStorage.savePreset('Preset 1', members);
    const result2 = crewPresetStorage.savePreset('Preset 2', members);

    // Update one while deleting another
    crewPresetStorage.updatePreset(result1.data!.id, { name: 'Updated 1' });
    crewPresetStorage.deletePreset(result2.data!.id);

    // Add a new one
    crewPresetStorage.savePreset('Preset 3', members);

    const presets = crewPresetStorage.getAllPresets();
    expect(presets.length).toBe(2);

    const names = presets.map((p) => p.name);
    expect(names).toContain('Updated 1');
    expect(names).toContain('Preset 3');
    expect(names).not.toContain('Preset 2');
  });

  it('should handle null percentShare values correctly', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', role: 'Captain', percentShare: null },
      { handle: 'Bob', role: 'Crew', percentShare: 100 },
    ];

    const result = crewPresetStorage.savePreset('Null Share Test', members);
    expect(result.success).toBe(true);

    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.members[0].percentShare).toBeNull();
    expect(retrieved.members[1].percentShare).toBe(100);
  });

  it('should handle zero percentShare values correctly', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', percentShare: 0 },
      { handle: 'Bob', percentShare: 100 },
    ];

    const result = crewPresetStorage.savePreset('Zero Share Test', members);
    expect(result.success).toBe(true);

    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.members[0].percentShare).toBe(0);
    expect(retrieved.members[1].percentShare).toBe(100);
  });

  it('should handle decimal percentShare values correctly', () => {
    const members: PresetMember[] = [
      { handle: 'Alice', percentShare: 33.33 },
      { handle: 'Bob', percentShare: 33.33 },
      { handle: 'Charlie', percentShare: 33.34 },
    ];

    const result = crewPresetStorage.savePreset('Decimal Share Test', members);
    expect(result.success).toBe(true);

    const retrieved = crewPresetStorage.getAllPresets()[0];
    expect(retrieved.members[0].percentShare).toBe(33.33);
    expect(retrieved.members[1].percentShare).toBe(33.33);
    expect(retrieved.members[2].percentShare).toBe(33.34);
  });
});
