// ============================================================================
// CLIENT-SIDE CSRF TOKEN UTILITIES TESTS
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCsrfToken, clearCsrfToken, getCsrfHeaders } from './csrf-client';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('csrf-client', () => {
  beforeEach(() => {
    // Clear the cached token before each test
    clearCsrfToken();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCsrfToken', () => {
    it('should fetch CSRF token from server', async () => {
      const mockToken = 'test-csrf-token-123';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      const token = await getCsrfToken();

      expect(token).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledWith('/', { method: 'HEAD' });
    });

    it('should cache the token after first fetch', async () => {
      const mockToken = 'cached-token-456';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      // First call - fetches from server
      const token1 = await getCsrfToken();
      expect(token1).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - returns cached token
      const token2 = await getCsrfToken();
      expect(token2).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should return null if token is not in response headers', async () => {
      mockFetch.mockResolvedValueOnce({
        headers: new Headers(),
      });

      const token = await getCsrfToken();

      expect(token).toBeNull();
    });

    it('should return null if fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const token = await getCsrfToken();

      expect(token).toBeNull();
    });

    it('should handle case-insensitive header lookup', async () => {
      const mockToken = 'case-insensitive-token';
      const headers = new Headers();
      headers.set('X-CSRF-TOKEN', mockToken); // Uppercase

      mockFetch.mockResolvedValueOnce({ headers });

      const token = await getCsrfToken();

      expect(token).toBe(mockToken);
    });
  });

  describe('clearCsrfToken', () => {
    it('should clear the cached token', async () => {
      const mockToken1 = 'first-token';
      const mockToken2 = 'second-token';

      // First fetch
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken1 }),
      });
      const token1 = await getCsrfToken();
      expect(token1).toBe(mockToken1);

      // Clear cache
      clearCsrfToken();

      // Second fetch - should make a new request
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken2 }),
      });
      const token2 = await getCsrfToken();
      expect(token2).toBe(mockToken2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not throw if called multiple times', () => {
      expect(() => {
        clearCsrfToken();
        clearCsrfToken();
        clearCsrfToken();
      }).not.toThrow();
    });
  });

  describe('getCsrfHeaders', () => {
    it('should create headers with CSRF token', async () => {
      const mockToken = 'headers-test-token';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      const headers = await getCsrfHeaders();

      expect(headers.get('x-csrf-token')).toBe(mockToken);
    });

    it('should include additional headers', async () => {
      const mockToken = 'additional-headers-token';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      const headers = await getCsrfHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });

      expect(headers.get('x-csrf-token')).toBe(mockToken);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Accept')).toBe('application/json');
    });

    it('should not include CSRF token if fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const headers = await getCsrfHeaders();

      expect(headers.get('x-csrf-token')).toBeNull();
    });

    it('should use cached token', async () => {
      const mockToken = 'cached-headers-token';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      // First call
      const headers1 = await getCsrfHeaders();
      expect(headers1.get('x-csrf-token')).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cached token
      const headers2 = await getCsrfHeaders();
      expect(headers2.get('x-csrf-token')).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should create empty headers if no additional headers provided', async () => {
      const mockToken = 'empty-headers-token';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      const headers = await getCsrfHeaders();

      expect(headers instanceof Headers).toBe(true);
      expect(headers.get('x-csrf-token')).toBe(mockToken);
      // Should only have the CSRF token, no other headers
      let headerCount = 0;
      headers.forEach(() => { headerCount++; });
      expect(headerCount).toBe(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle retry scenario after 403 error', async () => {
      const oldToken = 'old-stale-token';
      const newToken = 'new-fresh-token';

      // First request - get initial token
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': oldToken }),
      });
      const token1 = await getCsrfToken();
      expect(token1).toBe(oldToken);

      // Clear token after 403 error
      clearCsrfToken();

      // Second request - get new token
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': newToken }),
      });
      const token2 = await getCsrfToken();
      expect(token2).toBe(newToken);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should work for multiple concurrent requests after token is cached', async () => {
      const mockToken = 'concurrent-token';
      mockFetch.mockResolvedValueOnce({
        headers: new Headers({ 'x-csrf-token': mockToken }),
      });

      // First request caches the token
      await getCsrfToken();

      // Multiple concurrent requests should all get the cached token
      const [token1, token2, token3] = await Promise.all([
        getCsrfToken(),
        getCsrfToken(),
        getCsrfToken(),
      ]);

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch
    });
  });
});
