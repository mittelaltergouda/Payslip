import { generateSecureToken } from './crypto';

// Test cases for generateSecureToken() - Cryptographically secure token generation

describe('generateSecureToken', () => {
  describe('token format and structure', () => {
    it('should generate a token with correct default length (43 chars for 32 bytes)', () => {
      const token = generateSecureToken();
      // 32 bytes in base64 = 43 characters (without padding)
      expect(token.length).toBe(43);
    });

    it('should generate tokens with correct length for custom byte sizes', () => {
      // 16 bytes = 22 chars in base64url (no padding)
      const token16 = generateSecureToken(16);
      expect(token16.length).toBe(22);

      // 24 bytes = 32 chars in base64url (no padding)
      const token24 = generateSecureToken(24);
      expect(token24.length).toBe(32);

      // 48 bytes = 64 chars in base64url (no padding)
      const token48 = generateSecureToken(48);
      expect(token48.length).toBe(64);

      // 64 bytes = 86 chars in base64url (no padding)
      const token64 = generateSecureToken(64);
      expect(token64.length).toBe(86);
    });

    it('should generate non-empty token for minimum byte size', () => {
      const token = generateSecureToken(1);
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return a string type', () => {
      const token = generateSecureToken();
      expect(typeof token).toBe('string');
    });
  });

  describe('URL-safe base64 encoding', () => {
    it('should contain only URL-safe base64url characters', () => {
      // Generate multiple tokens to increase test coverage
      for (let i = 0; i < 100; i++) {
        const token = generateSecureToken();
        // base64url alphabet: A-Z, a-z, 0-9, -, _
        // Should NOT contain: +, /, =
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });

    it('should not contain standard base64 special characters (+, /, =)', () => {
      // Generate many tokens to ensure URL-safe encoding
      for (let i = 0; i < 100; i++) {
        const token = generateSecureToken();
        expect(token).not.toContain('+');
        expect(token).not.toContain('/');
        expect(token).not.toContain('='); // No padding
      }
    });

    it('should contain only alphanumeric, dash, and underscore characters', () => {
      const token = generateSecureToken();
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(urlSafePattern.test(token)).toBe(true);
    });

    it('should be URL-safe for various byte lengths', () => {
      const lengths = [8, 16, 24, 32, 48, 64, 128];
      lengths.forEach(length => {
        const token = generateSecureToken(length);
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(token).not.toContain('+');
        expect(token).not.toContain('/');
        expect(token).not.toContain('=');
      });
    });
  });

  describe('randomness and uniqueness', () => {
    it('should generate unique tokens on consecutive calls', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const token3 = generateSecureToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate 1000 unique tokens without collisions', () => {
      const tokens = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        tokens.add(generateSecureToken());
      }

      // All tokens should be unique (no collisions)
      expect(tokens.size).toBe(count);
    });

    it('should generate 10000 unique tokens without collisions (stress test)', () => {
      const tokens = new Set<string>();
      const count = 10000;

      for (let i = 0; i < count; i++) {
        tokens.add(generateSecureToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(count);
    });

    it('should generate different tokens for different byte lengths', () => {
      const token16 = generateSecureToken(16);
      const token32 = generateSecureToken(32);
      const token64 = generateSecureToken(64);

      expect(token16).not.toBe(token32);
      expect(token32).not.toBe(token64);
      expect(token16).not.toBe(token64);
    });

    it('should have high entropy (tokens should not have obvious patterns)', () => {
      const tokens = Array.from({ length: 100 }, () => generateSecureToken());

      // Check that tokens don't all start with same character
      const firstChars = new Set(tokens.map(t => t[0]));
      expect(firstChars.size).toBeGreaterThan(10); // Should have diverse starting chars

      // Check that tokens don't all end with same character
      const lastChars = new Set(tokens.map(t => t[t.length - 1]));
      expect(lastChars.size).toBeGreaterThan(10); // Should have diverse ending chars
    });

    it('should not generate sequential or predictable tokens', () => {
      const tokens = [
        generateSecureToken(),
        generateSecureToken(),
        generateSecureToken(),
        generateSecureToken(),
        generateSecureToken()
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

  describe('cryptographic security properties', () => {
    it('should use full character space of base64url alphabet', () => {
      // Generate many tokens and check they use diverse characters
      const allChars = new Set<string>();

      for (let i = 0; i < 500; i++) {
        const token = generateSecureToken();
        token.split('').forEach(char => allChars.add(char));
      }

      // Should use a good portion of the base64url alphabet (64 chars: A-Z, a-z, 0-9, -, _)
      // With 500 random tokens, we should see most characters
      expect(allChars.size).toBeGreaterThan(40); // At least ~63% of alphabet
    });

    it('should produce tokens with even character distribution', () => {
      const charCount: Record<string, number> = {};
      const tokens = Array.from({ length: 100 }, () => generateSecureToken());

      // Count character occurrences
      tokens.forEach(token => {
        token.split('').forEach(char => {
          charCount[char] = (charCount[char] || 0) + 1;
        });
      });

      const counts = Object.values(charCount);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

      // Check that no character appears way too frequently or rarely
      // (Allow reasonable variance for random distribution)
      counts.forEach(count => {
        expect(count).toBeGreaterThan(avg * 0.2); // Not too rare
        expect(count).toBeLessThan(avg * 3); // Not too frequent
      });
    });

    it('should generate tokens suitable for security-critical use', () => {
      const token = generateSecureToken(32);

      // 32 bytes = 256 bits of entropy
      // Should produce ~43 character token
      expect(token.length).toBe(43);

      // Verify it's URL-safe
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);

      // Verify no padding (security leak potential)
      expect(token).not.toContain('=');
    });

    it('should maintain security with larger token sizes', () => {
      // Test with recommended sizes for high-security applications
      const token128 = generateSecureToken(128); // 1024 bits
      const token256 = generateSecureToken(256); // 2048 bits

      expect(token128.length).toBeGreaterThan(100);
      expect(token256.length).toBeGreaterThan(200);

      expect(token128).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token256).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle zero bytes gracefully', () => {
      const token = generateSecureToken(0);
      expect(token).toBe('');
    });

    it('should handle very small byte sizes', () => {
      const token1 = generateSecureToken(1);
      expect(token1.length).toBeGreaterThan(0);
      expect(token1.length).toBeLessThanOrEqual(2);

      const token2 = generateSecureToken(2);
      expect(token2.length).toBeGreaterThan(0);
      expect(token2.length).toBeLessThanOrEqual(4);
    });

    it('should handle very large byte sizes', () => {
      const token = generateSecureToken(1024);
      expect(token.length).toBeGreaterThan(1000);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should produce different tokens even with small byte sizes', () => {
      const tokens = new Set<string>();
      // Even with just 8 bytes, should have high uniqueness
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken(8));
      }

      // 8 bytes = 64 bits, should have ~1.8e19 possibilities
      // Collision in 100 samples is extremely unlikely
      expect(tokens.size).toBe(100);
    });
  });

  describe('consistency and determinism', () => {
    it('should always return strings', () => {
      for (let i = 0; i < 50; i++) {
        const token = generateSecureToken();
        expect(typeof token).toBe('string');
      }
    });

    it('should always return non-null and non-undefined values', () => {
      for (let i = 0; i < 50; i++) {
        const token = generateSecureToken();
        expect(token).not.toBeNull();
        expect(token).not.toBeUndefined();
      }
    });

    it('should not throw errors during normal operation', () => {
      expect(() => generateSecureToken()).not.toThrow();
      expect(() => generateSecureToken(16)).not.toThrow();
      expect(() => generateSecureToken(32)).not.toThrow();
      expect(() => generateSecureToken(64)).not.toThrow();
    });

    it('should produce valid output for various valid byte lengths', () => {
      const validLengths = [1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 128, 256];

      validLengths.forEach(length => {
        expect(() => {
          const token = generateSecureToken(length);
          expect(token).toMatch(/^[A-Za-z0-9_-]*$/); // Allow empty for 0 bytes
        }).not.toThrow();
      });
    });
  });

  describe('practical use cases', () => {
    it('should generate tokens suitable for shareable session links', () => {
      const token = generateSecureToken();

      // Verify token can be used in a URL
      const url = `https://example.com/session/${token}`;
      expect(url).toContain(token);

      // Verify no URL encoding needed
      expect(encodeURIComponent(token)).toBe(token);
    });

    it('should generate tokens suitable for API endpoints', () => {
      const token = generateSecureToken();

      // Verify token works in query parameters
      const apiUrl = `https://api.example.com/export?token=${token}`;
      expect(apiUrl).toContain(token);

      // Verify no special characters that would break URLs
      expect(token).not.toContain('?');
      expect(token).not.toContain('&');
      expect(token).not.toContain('#');
      expect(token).not.toContain(' ');
    });

    it('should generate multiple unique tokens for the same session', () => {
      // Use case: creating multiple export tokens for a single session
      const sessionTokens = new Set<string>();

      for (let i = 0; i < 10; i++) {
        sessionTokens.add(generateSecureToken());
      }

      expect(sessionTokens.size).toBe(10);
    });

    it('should work correctly when called in rapid succession', () => {
      // Test that high-frequency generation doesn't cause issues
      const tokens: string[] = [];

      for (let i = 0; i < 100; i++) {
        tokens.push(generateSecureToken());
      }

      // All should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // All should be valid
      tokens.forEach(token => {
        expect(token.length).toBe(43);
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });

    it('should produce tokens that remain URL-safe after decoding attempts', () => {
      const token = generateSecureToken();

      // Verify that decoding doesn't change the token (it's already URL-safe)
      expect(decodeURIComponent(token)).toBe(token);

      // Verify encoding doesn't change it either
      expect(encodeURIComponent(token)).toBe(token);
    });
  });
});
