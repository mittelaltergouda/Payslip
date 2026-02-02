// ============================================================================
// CRYPTO UTILITIES
// ============================================================================
// This module provides cryptographic utilities for secure token generation
// used in shareable read-only session links.

import crypto from "crypto";

/**
 * Generates a cryptographically secure random token suitable for use in URLs.
 * Uses Node.js crypto.randomBytes() to ensure unpredictable token generation
 * with sufficient entropy to prevent brute-force enumeration.
 *
 * The token is encoded using URL-safe base64 (base64url), which replaces
 * '+' with '-' and '/' with '_', and removes padding '=' characters.
 * This ensures tokens can be safely used in URLs without encoding issues.
 *
 * Security properties:
 * - 32 bytes (256 bits) of cryptographically secure random data
 * - ~4.3 x 10^76 possible tokens (2^256)
 * - Brute-force resistance: infeasible to enumerate
 * - URL-safe encoding for use in query parameters and paths
 *
 * @param byteLength - Number of random bytes to generate (default: 32)
 * @returns URL-safe base64-encoded token string (43 characters for 32 bytes)
 *
 * @example
 * generateSecureToken()
 * // "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i"
 *
 * @example
 * // Generate multiple unique tokens
 * const token1 = generateSecureToken();
 * const token2 = generateSecureToken();
 * console.assert(token1 !== token2); // Always different
 *
 * @example
 * // Use in shareable link
 * const token = generateSecureToken();
 * const shareUrl = `https://example.com/session/${token}`;
 */
export function generateSecureToken(byteLength: number = 32): string {
  // Generate cryptographically secure random bytes
  const buffer = crypto.randomBytes(byteLength);

  // Convert to URL-safe base64 (base64url encoding)
  // - Replace '+' with '-'
  // - Replace '/' with '_'
  // - Remove padding '='
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
