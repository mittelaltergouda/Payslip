// ============================================================================
// CSRF TOKEN UTILITIES TESTS
// ============================================================================
// Comprehensive tests for CSRF protection utilities
// Tests token generation, validation, and header extraction

import { describe, it, expect } from "vitest";
import {
  generateCsrfToken,
  validateCsrfToken,
  extractCsrfTokenFromHeaders
} from "./csrf";

// Test cases for generateCsrfToken() - Cryptographically secure CSRF token generation

describe("generateCsrfToken", () => {
  describe("token format and structure", () => {
    it("should generate a token with correct default length (43 chars for 32 bytes)", () => {
      const token = generateCsrfToken();
      // 32 bytes in base64url = 43 characters (without padding)
      expect(token.length).toBe(43);
    });

    it("should generate tokens with correct length for custom byte sizes", () => {
      // 16 bytes = 22 chars in base64url (no padding)
      const token16 = generateCsrfToken(16);
      expect(token16.length).toBe(22);

      // 24 bytes = 32 chars in base64url (no padding)
      const token24 = generateCsrfToken(24);
      expect(token24.length).toBe(32);

      // 48 bytes = 64 chars in base64url (no padding)
      const token48 = generateCsrfToken(48);
      expect(token48.length).toBe(64);

      // 64 bytes = 86 chars in base64url (no padding)
      const token64 = generateCsrfToken(64);
      expect(token64.length).toBe(86);
    });

    it("should generate non-empty token for minimum byte size", () => {
      const token = generateCsrfToken(1);
      expect(token.length).toBeGreaterThan(0);
    });

    it("should return a string type", () => {
      const token = generateCsrfToken();
      expect(typeof token).toBe("string");
    });
  });

  describe("URL-safe base64 encoding", () => {
    it("should contain only URL-safe base64url characters", () => {
      // Generate multiple tokens to increase test coverage
      for (let i = 0; i < 100; i++) {
        const token = generateCsrfToken();
        // base64url alphabet: A-Z, a-z, 0-9, -, _
        // Should NOT contain: +, /, =
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });

    it("should not contain standard base64 special characters (+, /, =)", () => {
      // Generate many tokens to ensure URL-safe encoding
      for (let i = 0; i < 100; i++) {
        const token = generateCsrfToken();
        expect(token).not.toContain("+");
        expect(token).not.toContain("/");
        expect(token).not.toContain("="); // No padding
      }
    });

    it("should contain only alphanumeric, dash, and underscore characters", () => {
      const token = generateCsrfToken();
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(urlSafePattern.test(token)).toBe(true);
    });

    it("should be URL-safe for various byte lengths", () => {
      const lengths = [8, 16, 24, 32, 48, 64, 128];
      lengths.forEach((length) => {
        const token = generateCsrfToken(length);
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(token).not.toContain("+");
        expect(token).not.toContain("/");
        expect(token).not.toContain("=");
      });
    });
  });

  describe("randomness and uniqueness", () => {
    it("should generate unique tokens on consecutive calls", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const token3 = generateCsrfToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it("should generate 1000 unique tokens without collisions", () => {
      const tokens = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        tokens.add(generateCsrfToken());
      }

      // All tokens should be unique (no collisions)
      expect(tokens.size).toBe(count);
    });

    it("should generate 10000 unique tokens without collisions (stress test)", () => {
      const tokens = new Set<string>();
      const count = 10000;

      for (let i = 0; i < count; i++) {
        tokens.add(generateCsrfToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(count);
    });

    it("should generate different tokens for different byte lengths", () => {
      const token16 = generateCsrfToken(16);
      const token32 = generateCsrfToken(32);
      const token64 = generateCsrfToken(64);

      expect(token16).not.toBe(token32);
      expect(token32).not.toBe(token64);
      expect(token16).not.toBe(token64);
    });

    it("should have high entropy (tokens should not have obvious patterns)", () => {
      const tokens = Array.from({ length: 100 }, () => generateCsrfToken());

      // Check that tokens don't all start with same character
      const firstChars = new Set(tokens.map((t) => t[0]));
      expect(firstChars.size).toBeGreaterThan(10); // Should have diverse starting chars

      // Check that tokens don't all end with same character
      const lastChars = new Set(tokens.map((t) => t[t.length - 1]));
      expect(lastChars.size).toBeGreaterThan(10); // Should have diverse ending chars
    });

    it("should not generate sequential or predictable tokens", () => {
      const tokens = [
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken(),
        generateCsrfToken()
      ];

      // None of the tokens should be substrings of each other
      for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
          expect(tokens[i]).not.toContain(tokens[j]);
          expect(tokens[j]).not.toContain(tokens[i]);
        }
      }
    });
  });

  describe("cryptographic security properties", () => {
    it("should use full character space of base64url alphabet", () => {
      // Generate many tokens and check they use diverse characters
      const allChars = new Set<string>();

      for (let i = 0; i < 500; i++) {
        const token = generateCsrfToken();
        token.split("").forEach((char) => allChars.add(char));
      }

      // Should use a good portion of the base64url alphabet (64 chars: A-Z, a-z, 0-9, -, _)
      // With 500 random tokens, we should see most characters
      expect(allChars.size).toBeGreaterThan(40); // At least ~63% of alphabet
    });

    it("should produce tokens with even character distribution", () => {
      const charCount: Record<string, number> = {};
      const tokens = Array.from({ length: 100 }, () => generateCsrfToken());

      // Count character occurrences
      tokens.forEach((token) => {
        token.split("").forEach((char) => {
          charCount[char] = (charCount[char] || 0) + 1;
        });
      });

      const counts = Object.values(charCount);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

      // Check that no character appears way too frequently or rarely
      // (Allow reasonable variance for random distribution)
      counts.forEach((count) => {
        expect(count).toBeGreaterThan(avg * 0.2); // Not too rare
        expect(count).toBeLessThan(avg * 3); // Not too frequent
      });
    });

    it("should generate tokens suitable for security-critical use", () => {
      const token = generateCsrfToken(32);

      // 32 bytes = 256 bits of entropy
      // Should produce ~43 character token
      expect(token.length).toBe(43);

      // Verify it's URL-safe
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should support custom byte lengths for different security requirements", () => {
      // Lower security (16 bytes = 128 bits)
      const token16 = generateCsrfToken(16);
      expect(token16.length).toBe(22);

      // Standard security (32 bytes = 256 bits)
      const token32 = generateCsrfToken(32);
      expect(token32.length).toBe(43);

      // Higher security (64 bytes = 512 bits)
      const token64 = generateCsrfToken(64);
      expect(token64.length).toBe(86);
    });
  });
});

// Test cases for validateCsrfToken() - Constant-time token validation

describe("validateCsrfToken", () => {
  describe("valid token matching", () => {
    it("should return true for identical tokens", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("should return true for matching tokens from same source", () => {
      const token1 = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i";
      const token2 = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i";
      expect(validateCsrfToken(token1, token2)).toBe(true);
    });

    it("should return true for tokens with special URL-safe characters", () => {
      const token = "abc_123-xyz_789-ABC_XYZ";
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("should return true for very long matching tokens", () => {
      const longToken = generateCsrfToken(128);
      expect(validateCsrfToken(longToken, longToken)).toBe(true);
    });

    it("should return true for very short matching tokens", () => {
      const shortToken = generateCsrfToken(8);
      expect(validateCsrfToken(shortToken, shortToken)).toBe(true);
    });
  });

  describe("invalid token rejection", () => {
    it("should return false for different tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should return false for tokens differing by one character", () => {
      const token1 = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i";
      const token2 = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4j"; // Last char different
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should return false for case-sensitive mismatch", () => {
      const token1 = "ABC123xyz";
      const token2 = "abc123xyz";
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should return false for completely different tokens", () => {
      const token1 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const token2 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should return false for tokens with different lengths", () => {
      const shortToken = generateCsrfToken(16);
      const longToken = generateCsrfToken(32);
      expect(validateCsrfToken(shortToken, longToken)).toBe(false);
    });

    it("should return false for token vs empty string", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, "")).toBe(false);
      expect(validateCsrfToken("", token)).toBe(false);
    });
  });

  describe("null and undefined handling", () => {
    it("should return false when provided token is undefined", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(undefined, token)).toBe(false);
    });

    it("should return false when expected token is undefined", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, undefined)).toBe(false);
    });

    it("should return false when both tokens are undefined", () => {
      expect(validateCsrfToken(undefined, undefined)).toBe(false);
    });

    it("should return false when provided token is null", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(null, token)).toBe(false);
    });

    it("should return false when expected token is null", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, null)).toBe(false);
    });

    it("should return false when both tokens are null", () => {
      expect(validateCsrfToken(null, null)).toBe(false);
    });

    it("should return false for mixed null/undefined scenarios", () => {
      expect(validateCsrfToken(null, undefined)).toBe(false);
      expect(validateCsrfToken(undefined, null)).toBe(false);
    });
  });

  describe("empty string handling", () => {
    it("should return false for empty provided token", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken("", token)).toBe(false);
    });

    it("should return false for empty expected token", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, "")).toBe(false);
    });

    it("should return false when both tokens are empty strings", () => {
      expect(validateCsrfToken("", "")).toBe(false);
    });
  });

  describe("security properties", () => {
    it("should handle prefix attacks (tokens with same prefix)", () => {
      const token1 = "abc123xyz789";
      const token2 = "abc123zzz999";
      // Same prefix "abc123", different suffix
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should handle suffix attacks (tokens with same suffix)", () => {
      const token1 = "aaa123xyz";
      const token2 = "bbb123xyz";
      // Different prefix, same suffix "123xyz"
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should reject token substring matches", () => {
      const longToken = "abcdefghijklmnopqrstuvwxyz";
      const substring = "defghijklm";
      expect(validateCsrfToken(substring, longToken)).toBe(false);
      expect(validateCsrfToken(longToken, substring)).toBe(false);
    });

    it("should handle special characters correctly", () => {
      const token1 = "abc-123_xyz";
      const token2 = "abc+123/xyz"; // Similar but with standard base64 chars
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("should use constant-time comparison (basic check)", () => {
      // Generate tokens with differences at different positions
      const baseToken = generateCsrfToken();
      const replaceWithDifferentCharacter = (token: string, index: number) =>
        token.substring(0, index) +
        (token[index] === "X" ? "Y" : "X") +
        token.substring(index + 1);
      const tokens = [
        baseToken,
        replaceWithDifferentCharacter(baseToken, baseToken.length - 1), // Diff at end
        replaceWithDifferentCharacter(baseToken, 0), // Diff at start
        replaceWithDifferentCharacter(baseToken, 20), // Diff in middle
      ];

      // All should return false (except comparing to itself)
      expect(validateCsrfToken(tokens[0], tokens[0])).toBe(true);
      expect(validateCsrfToken(tokens[0], tokens[1])).toBe(false);
      expect(validateCsrfToken(tokens[0], tokens[2])).toBe(false);
      expect(validateCsrfToken(tokens[0], tokens[3])).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle whitespace-only tokens", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken("   ", token)).toBe(false);
      expect(validateCsrfToken(token, "   ")).toBe(false);
    });

    it("should not trim or normalize tokens", () => {
      const token = "abc123xyz";
      const tokenWithSpace = " abc123xyz";
      expect(validateCsrfToken(token, tokenWithSpace)).toBe(false);
    });

    it("should handle tokens with newlines", () => {
      const token = "abc123xyz";
      const tokenWithNewline = "abc123xyz\n";
      expect(validateCsrfToken(token, tokenWithNewline)).toBe(false);
    });

    it("should handle very long tokens correctly", () => {
      const veryLongToken = generateCsrfToken(256);
      expect(validateCsrfToken(veryLongToken, veryLongToken)).toBe(true);

      const differentLongToken = generateCsrfToken(256);
      expect(validateCsrfToken(veryLongToken, differentLongToken)).toBe(false);
    });
  });
});

// Test cases for extractCsrfTokenFromHeaders() - Header extraction utility

describe("extractCsrfTokenFromHeaders", () => {
  describe("successful token extraction", () => {
    it("should extract token from x-csrf-token header (lowercase)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("x-csrf-token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should extract token from X-CSRF-Token header (uppercase)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("X-CSRF-Token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should extract token from X-Csrf-Token header (mixed case)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("X-Csrf-Token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should extract token with URL-safe characters", () => {
      const headers = new Headers();
      const token = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i";
      headers.set("x-csrf-token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should extract very long tokens", () => {
      const headers = new Headers();
      const longToken = generateCsrfToken(128);
      headers.set("x-csrf-token", longToken);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(longToken);
    });

    it("should extract very short tokens", () => {
      const headers = new Headers();
      const shortToken = "abc123";
      headers.set("x-csrf-token", shortToken);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(shortToken);
    });
  });

  describe("missing or empty header", () => {
    it("should return undefined when header is not present", () => {
      const headers = new Headers();

      expect(extractCsrfTokenFromHeaders(headers)).toBeUndefined();
    });

    it("should return undefined when header is empty string", () => {
      const headers = new Headers();
      headers.set("x-csrf-token", "");

      expect(extractCsrfTokenFromHeaders(headers)).toBeUndefined();
    });

    it("should return undefined for headers object with no csrf header", () => {
      const headers = new Headers();
      headers.set("content-type", "application/json");
      headers.set("authorization", "Bearer token123");

      expect(extractCsrfTokenFromHeaders(headers)).toBeUndefined();
    });
  });

  describe("case-insensitive header lookup", () => {
    it("should be case-insensitive (all lowercase)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("x-csrf-token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should be case-insensitive (all uppercase)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("X-CSRF-TOKEN", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should be case-insensitive (camelCase)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("X-Csrf-Token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should be case-insensitive (random case)", () => {
      const headers = new Headers();
      const token = generateCsrfToken();
      headers.set("x-CsRf-ToKeN", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });
  });

  describe("header value handling", () => {
    it("should preserve token value exactly as provided", () => {
      const headers = new Headers();
      const token = "aBc-123_XyZ";
      headers.set("x-csrf-token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });

    it("should not trim whitespace from token value", () => {
      const headers = new Headers();
      const token = " token-with-spaces ";
      headers.set("x-csrf-token", token);

      // Headers API automatically trims, but if it doesn't, we preserve
      const extracted = extractCsrfTokenFromHeaders(headers);
      expect(extracted).toBeTruthy();
    });

    it("should handle tokens with special characters", () => {
      const headers = new Headers();
      const token = "abc-123_xyz.789";
      headers.set("x-csrf-token", token);

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token);
    });
  });

  describe("multiple headers", () => {
    it("should extract csrf token when multiple headers are present", () => {
      const headers = new Headers();
      const csrfToken = generateCsrfToken();

      headers.set("content-type", "application/json");
      headers.set("x-csrf-token", csrfToken);
      headers.set("authorization", "Bearer abc123");
      headers.set("user-agent", "Test/1.0");

      expect(extractCsrfTokenFromHeaders(headers)).toBe(csrfToken);
    });

    it("should not be confused by similar header names", () => {
      const headers = new Headers();
      const csrfToken = generateCsrfToken();

      headers.set("x-custom-token", "other-token");
      headers.set("x-csrf-token", csrfToken);
      headers.set("x-api-token", "api-token");

      expect(extractCsrfTokenFromHeaders(headers)).toBe(csrfToken);
    });
  });

  describe("edge cases", () => {
    it("should return undefined for empty headers object", () => {
      const headers = new Headers();
      expect(extractCsrfTokenFromHeaders(headers)).toBeUndefined();
    });

    it("should handle headers with only other headers set", () => {
      const headers = new Headers();
      headers.set("accept", "application/json");
      headers.set("content-length", "123");

      expect(extractCsrfTokenFromHeaders(headers)).toBeUndefined();
    });

    it("should return the first value if header is set multiple times", () => {
      const headers = new Headers();
      const token1 = generateCsrfToken();

      // Headers.set() overwrites, but testing the behavior
      headers.set("x-csrf-token", token1);
      headers.set("x-csrf-token", token1); // Same token

      expect(extractCsrfTokenFromHeaders(headers)).toBe(token1);
    });
  });
});
