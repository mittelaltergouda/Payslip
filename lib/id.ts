// ============================================================================
// ID GENERATION UTILITIES
// ============================================================================
// This module provides cryptographically secure ID generation utilities
// for member IDs, expense IDs, and other identifiers throughout the application.
//
// SECURITY: All ID generation uses cryptographically secure random sources.
// Never falls back to Math.random() to prevent predictable ID generation
// that could enable IDOR (Insecure Direct Object Reference) attacks.

/**
 * Generates a cryptographically secure unique identifier.
 *
 * Uses crypto.randomUUID() when available (modern browsers and Node.js 15+),
 * otherwise falls back to a custom UUID v4 implementation using crypto.getRandomValues().
 *
 * For server-side rendering compatibility, attempts to use node:crypto module
 * when Web Crypto API is not available.
 *
 * **SECURITY NOTE**: This function never falls back to Math.random().
 * All random values are generated using cryptographically secure sources
 * to prevent predictable IDs that could be exploited in attacks.
 *
 * @returns A cryptographically secure UUID v4 string in standard format
 *          (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @throws Error if no cryptographically secure random source is available
 *
 * @example
 * const memberId = generateId();
 * // Returns: "a3bb189e-8bf9-3888-9912-ace4e6543002"
 *
 * @example
 * const expenseId = generateId();
 * // Returns: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 */
export function generateId(): string {
  // Try Web Crypto API (browser and modern Node.js)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  // Fallback to crypto.getRandomValues() for UUID v4 generation
  // This works in browsers that support getRandomValues but not randomUUID
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return generateUuidV4WithGetRandomValues();
  }

  // Try Node.js crypto module for server-side rendering
  try {
    // Dynamic import for Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('node:crypto');
    if (nodeCrypto && typeof nodeCrypto.randomUUID === 'function') {
      return nodeCrypto.randomUUID();
    }
  } catch {
    // node:crypto not available, continue to error
  }

  // No cryptographically secure source available
  throw new Error(
    'No cryptographically secure random source available. ' +
    'This environment does not support crypto.randomUUID(), crypto.getRandomValues(), or node:crypto.'
  );
}

/**
 * Generates a UUID v4 using crypto.getRandomValues().
 *
 * This is a fallback implementation for environments that support
 * crypto.getRandomValues() but not crypto.randomUUID().
 *
 * Follows RFC 4122 section 4.4 for UUID v4 generation:
 * - Sets version bits to 0100 (version 4)
 * - Sets variant bits to 10xx (RFC 4122 variant)
 *
 * @returns A UUID v4 string in standard format
 *
 * @internal This function is exported for testing purposes only
 */
export function generateUuidV4WithGetRandomValues(): string {
  // Generate 16 random bytes
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) and variant (RFC 4122) bits
  // Version: Set bits 4-7 of byte 6 to 0100 (version 4)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Variant: Set bits 6-7 of byte 8 to 10 (RFC 4122 variant)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Convert bytes to UUID string format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
