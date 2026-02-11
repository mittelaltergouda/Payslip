// ============================================================================
// CSRF TOKEN UTILITIES
// ============================================================================
// This module provides CSRF (Cross-Site Request Forgery) protection utilities
// for securing state-changing API endpoints against unauthorized requests.

import crypto from "crypto";

/**
 * Generates a cryptographically secure CSRF token for protecting against
 * cross-site request forgery attacks. Uses Node.js crypto.randomBytes() to
 * ensure unpredictable token generation with sufficient entropy.
 *
 * The token is encoded using URL-safe base64 (base64url), which replaces
 * '+' with '-' and '/' with '_', and removes padding '=' characters.
 * This ensures tokens can be safely transmitted in HTTP headers.
 *
 * Security properties:
 * - 32 bytes (256 bits) of cryptographically secure random data
 * - ~4.3 x 10^76 possible tokens (2^256)
 * - Brute-force resistance: infeasible to enumerate
 * - URL-safe encoding for use in HTTP headers
 *
 * @param byteLength - Number of random bytes to generate (default: 32)
 * @returns URL-safe base64-encoded CSRF token string (43 characters for 32 bytes)
 *
 * @example
 * const token = generateCsrfToken();
 * // "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i"
 *
 * @example
 * // Generate token and set in response header
 * const csrfToken = generateCsrfToken();
 * response.setHeader('x-csrf-token', csrfToken);
 *
 * @example
 * // Generate multiple unique tokens
 * const token1 = generateCsrfToken();
 * const token2 = generateCsrfToken();
 * console.assert(token1 !== token2); // Always different
 */
export function generateCsrfToken(byteLength: number = 32): string {
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

/**
 * Validates a CSRF token using constant-time comparison to prevent timing attacks.
 * Both tokens must be non-empty strings of equal length to be considered valid.
 *
 * Uses crypto.timingSafeEqual() to ensure the comparison takes the same amount
 * of time regardless of where differences occur in the tokens. This prevents
 * attackers from using timing information to gradually guess valid tokens.
 *
 * Security properties:
 * - Constant-time comparison prevents timing attack vulnerabilities
 * - Requires exact match (case-sensitive)
 * - Rejects empty strings or mismatched lengths immediately
 * - No early exit on mismatch that could leak timing information
 *
 * @param providedToken - Token provided by the client (from request header)
 * @param expectedToken - Token expected by the server (from session/context)
 * @returns true if tokens match exactly, false otherwise
 *
 * @example
 * const serverToken = generateCsrfToken();
 * const clientToken = request.headers['x-csrf-token'];
 * if (!validateCsrfToken(clientToken, serverToken)) {
 *   return Response.json({ error: 'Invalid CSRF token' }, { status: 403 });
 * }
 *
 * @example
 * // Valid token validation
 * const token = generateCsrfToken();
 * validateCsrfToken(token, token); // true
 *
 * @example
 * // Invalid token validation
 * validateCsrfToken('invalid', 'expected'); // false
 * validateCsrfToken('', 'expected'); // false
 * validateCsrfToken('short', 'verylongtoken'); // false
 */
export function validateCsrfToken(
  providedToken: string | undefined | null,
  expectedToken: string | undefined | null
): boolean {
  // Reject if either token is missing or empty
  if (!providedToken || !expectedToken) {
    return false;
  }

  // Reject if tokens have different lengths (prevents timing attacks via length comparison)
  if (providedToken.length !== expectedToken.length) {
    return false;
  }

  try {
    // Convert strings to buffers for constant-time comparison
    const providedBuffer = Buffer.from(providedToken, "utf8");
    const expectedBuffer = Buffer.from(expectedToken, "utf8");

    // Use crypto.timingSafeEqual for constant-time comparison
    // This prevents timing attacks by ensuring comparison always takes same time
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    // timingSafeEqual throws if buffers have different lengths
    // This should not happen due to length check above, but handle gracefully
    return false;
  }
}

/**
 * Extracts the CSRF token from HTTP request headers.
 * Looks for the 'x-csrf-token' header (case-insensitive) and returns its value.
 *
 * The function normalizes header lookup by converting to lowercase, as HTTP
 * headers are case-insensitive per RFC 7230. Supports both standard Headers
 * objects and Next.js Headers instances.
 *
 * @param headers - Headers object from the HTTP request
 * @returns The CSRF token string if found, undefined otherwise
 *
 * @example
 * const token = extractCsrfTokenFromHeaders(request.headers);
 * if (!token) {
 *   return Response.json({ error: 'CSRF token required' }, { status: 403 });
 * }
 *
 * @example
 * // Case-insensitive header lookup
 * headers.set('X-CSRF-Token', 'abc123');
 * extractCsrfTokenFromHeaders(headers); // 'abc123'
 *
 * headers.set('x-csrf-token', 'def456');
 * extractCsrfTokenFromHeaders(headers); // 'def456'
 */
export function extractCsrfTokenFromHeaders(
  headers: Headers
): string | undefined {
  // HTTP headers are case-insensitive per RFC 7230
  // Look for 'x-csrf-token' header (case-insensitive)
  return headers.get("x-csrf-token") || undefined;
}
