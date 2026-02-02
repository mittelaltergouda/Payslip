import { generateId, generateUuidV4WithGetRandomValues } from './id';

// Test cases for generateId() - Main ID generation function

describe('generateId', () => {
  it('should generate a valid UUID v4 format', () => {
    const id = generateId();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hex digit, 4 is the version, and y is 8, 9, a, or b
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id).toMatch(uuidV4Regex);
  });

  it('should generate unique IDs on multiple calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate IDs with correct length', () => {
    const id = generateId();

    // UUID format with dashes: 8-4-4-4-12 = 36 characters total
    expect(id.length).toBe(36);
  });

  it('should generate IDs with dashes in correct positions', () => {
    const id = generateId();

    expect(id[8]).toBe('-');
    expect(id[13]).toBe('-');
    expect(id[18]).toBe('-');
    expect(id[23]).toBe('-');
  });

  it('should generate multiple unique IDs in a set', () => {
    const ids = new Set<string>();
    const count = 100;

    for (let i = 0; i < count; i++) {
      ids.add(generateId());
    }

    // All IDs should be unique
    expect(ids.size).toBe(count);
  });

  it('should generate IDs with version 4 marker', () => {
    const id = generateId();

    // 15th character (index 14) should be '4' for UUID v4
    expect(id[14]).toBe('4');
  });

  it('should generate IDs with RFC 4122 variant marker', () => {
    const id = generateId();

    // 20th character (index 19) should be '8', '9', 'a', or 'b' for RFC 4122 variant
    const variantChar = id[19].toLowerCase();
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });

  it('should only use lowercase hex characters', () => {
    const id = generateId();

    // Remove dashes and check all characters are lowercase hex
    const hexPart = id.replace(/-/g, '');
    const lowercaseHexRegex = /^[0-9a-f]+$/;

    expect(hexPart).toMatch(lowercaseHexRegex);
  });
});

// Test cases for generateUuidV4WithGetRandomValues() - Fallback UUID v4 implementation

describe('generateUuidV4WithGetRandomValues', () => {
  it('should generate a valid UUID v4 format', () => {
    const id = generateUuidV4WithGetRandomValues();

    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id).toMatch(uuidV4Regex);
  });

  it('should generate unique IDs on multiple calls', () => {
    const id1 = generateUuidV4WithGetRandomValues();
    const id2 = generateUuidV4WithGetRandomValues();
    const id3 = generateUuidV4WithGetRandomValues();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate IDs with correct UUID v4 version bits', () => {
    const id = generateUuidV4WithGetRandomValues();

    // Version 4: character at position 14 should be '4'
    expect(id[14]).toBe('4');
  });

  it('should generate IDs with correct RFC 4122 variant bits', () => {
    const id = generateUuidV4WithGetRandomValues();

    // RFC 4122 variant: character at position 19 should be '8', '9', 'a', or 'b'
    const variantChar = id[19].toLowerCase();
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });

  it('should generate IDs with correct structure', () => {
    const id = generateUuidV4WithGetRandomValues();

    // Check length
    expect(id.length).toBe(36);

    // Check dash positions
    expect(id[8]).toBe('-');
    expect(id[13]).toBe('-');
    expect(id[18]).toBe('-');
    expect(id[23]).toBe('-');

    // Check segment lengths (remove dashes and verify total)
    const segments = id.split('-');
    expect(segments[0].length).toBe(8);
    expect(segments[1].length).toBe(4);
    expect(segments[2].length).toBe(4);
    expect(segments[3].length).toBe(4);
    expect(segments[4].length).toBe(12);
  });

  it('should only use lowercase hexadecimal characters', () => {
    const id = generateUuidV4WithGetRandomValues();

    const hexPart = id.replace(/-/g, '');
    const lowercaseHexRegex = /^[0-9a-f]+$/;

    expect(hexPart).toMatch(lowercaseHexRegex);
  });

  it('should generate statistically unique IDs', () => {
    const ids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      ids.add(generateUuidV4WithGetRandomValues());
    }

    // All IDs should be unique (collision probability is astronomically low)
    expect(ids.size).toBe(count);
  });

  it('should have different random parts in each ID', () => {
    const id1 = generateUuidV4WithGetRandomValues();
    const id2 = generateUuidV4WithGetRandomValues();

    // Split by dashes
    const parts1 = id1.split('-');
    const parts2 = id2.split('-');

    // At least one segment should be different (extremely likely all will be)
    let differenceCount = 0;
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] !== parts2[i]) {
        differenceCount++;
      }
    }

    expect(differenceCount).toBeGreaterThan(0);
  });
});

// Test cases for UUID v4 specification compliance

describe('UUID v4 specification compliance', () => {
  it('should set version bits correctly (bits 12-15 of time_hi_and_version)', () => {
    const id = generateUuidV4WithGetRandomValues();

    // Extract the version field (3rd segment, first character)
    const versionChar = id[14];

    // Should be '4' for UUID v4
    expect(versionChar).toBe('4');
  });

  it('should set variant bits correctly (bits 6-7 of clock_seq_hi_and_reserved)', () => {
    const id = generateUuidV4WithGetRandomValues();

    // Extract the variant field (4th segment, first character)
    const variantChar = id[19];

    // Should be '8', '9', 'a', or 'b' (binary 10xx)
    const variantValue = parseInt(variantChar, 16);

    // Check that bits 6-7 are '10' (0x8 to 0xB in the high nibble)
    expect(variantValue & 0x0C).toBe(0x08);
  });

  it('should have random data in all other fields', () => {
    // Generate multiple IDs and verify they differ in random fields
    const ids = Array.from({ length: 10 }, () => generateUuidV4WithGetRandomValues());

    // Check that at least some variation exists in each segment
    for (let segmentIndex = 0; segmentIndex < 5; segmentIndex++) {
      const segmentValues = new Set(ids.map(id => id.split('-')[segmentIndex]));

      // Each segment should have multiple unique values across 10 IDs
      // (except possibly the fixed parts)
      if (segmentIndex === 2) {
        // Version segment - first char is fixed to '4', rest should vary
        const restOfSegment = new Set(ids.map(id => id.split('-')[segmentIndex].slice(1)));
        expect(restOfSegment.size).toBeGreaterThan(1);
      } else if (segmentIndex === 3) {
        // Variant segment - first char is limited, rest should vary
        const restOfSegment = new Set(ids.map(id => id.split('-')[segmentIndex].slice(1)));
        expect(restOfSegment.size).toBeGreaterThan(1);
      } else {
        // Other segments should have high variation
        expect(segmentValues.size).toBeGreaterThan(1);
      }
    }
  });
});

// Test cases for security properties

describe('security properties', () => {
  it('should use cryptographically secure randomness', () => {
    // Generate a large sample and check for basic randomness properties
    const ids = Array.from({ length: 100 }, () => generateId());

    // Check that IDs are all unique (no duplicates)
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Check that the distribution of hex characters appears random
    // (not a perfect test, but catches obvious non-random patterns)
    const allHexChars = ids.join('').replace(/-/g, '').split('');
    const hexCharCounts = new Map<string, number>();

    for (const char of allHexChars) {
      hexCharCounts.set(char, (hexCharCounts.get(char) || 0) + 1);
    }

    // Each hex character (0-9, a-f) should appear at least once in 100 UUIDs
    // (statistically very likely with cryptographically secure randomness)
    expect(hexCharCounts.size).toBeGreaterThan(10);
  });

  it('should not generate predictable sequences', () => {
    // Generate consecutive IDs and verify they are not sequential
    const id1 = generateId();
    const id2 = generateId();

    // Remove dashes and convert to numbers for comparison
    const hex1 = id1.replace(/-/g, '');
    const hex2 = id2.replace(/-/g, '');

    // IDs should not be sequential (differ by 1)
    const num1 = BigInt('0x' + hex1);
    const num2 = BigInt('0x' + hex2);
    const difference = num2 > num1 ? num2 - num1 : num1 - num2;

    expect(difference).not.toBe(1n);
    expect(difference).toBeGreaterThan(1n);
  });

  it('should generate IDs suitable for use as secure identifiers', () => {
    // Generate IDs and verify they meet security requirements
    const ids = Array.from({ length: 50 }, () => generateId());

    // All IDs should be unique (no collisions)
    expect(new Set(ids).size).toBe(ids.length);

    // All IDs should be valid UUID v4 format
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const id of ids) {
      expect(id).toMatch(uuidV4Regex);
    }
  });
});

// Test cases for edge cases and error conditions

describe('edge cases', () => {
  it('should handle rapid successive calls without collisions', () => {
    const ids = new Set<string>();
    const count = 1000;

    // Generate many IDs rapidly
    for (let i = 0; i < count; i++) {
      ids.add(generateId());
    }

    // No collisions should occur
    expect(ids.size).toBe(count);
  });

  it('should generate consistent format across multiple calls', () => {
    const ids = Array.from({ length: 100 }, () => generateId());

    // All should have same structure
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const id of ids) {
      expect(id).toMatch(uuidV4Regex);
      expect(id.length).toBe(36);
      expect(id[14]).toBe('4');
    }
  });
});
