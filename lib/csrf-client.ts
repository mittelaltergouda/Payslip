// ============================================================================
// CLIENT-SIDE CSRF TOKEN UTILITIES
// ============================================================================
// This module provides client-side utilities for handling CSRF tokens in
// browser environments. Works with the server-side CSRF implementation to
// protect against cross-site request forgery attacks.

/**
 * Cached CSRF token to avoid unnecessary API calls.
 * Token is fetched once and reused for subsequent requests.
 */
let cachedCsrfToken: string | null = null;

/**
 * Fetches a fresh CSRF token from the server by making a lightweight request.
 * The middleware automatically includes the CSRF token in response headers.
 *
 * This function makes a HEAD request to the root path to minimize bandwidth
 * while still triggering the middleware to generate and return a CSRF token.
 *
 * @returns Promise resolving to the CSRF token string, or null if unavailable
 *
 * @example
 * const token = await getCsrfToken();
 * if (token) {
 *   await fetch('/api/sessions/abc123', {
 *     method: 'DELETE',
 *     headers: { 'x-csrf-token': token }
 *   });
 * }
 */
export async function getCsrfToken(): Promise<string | null> {
  // Return cached token if available
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  try {
    // Make a lightweight HEAD request to trigger middleware
    // The middleware will include the CSRF token in response headers
    const response = await fetch('/', { method: 'HEAD' });

    // Extract token from response header
    const token = response.headers.get('x-csrf-token');

    // Cache the token for future requests
    if (token) {
      cachedCsrfToken = token;
    }

    return token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * Clears the cached CSRF token, forcing the next getCsrfToken() call to
 * fetch a fresh token from the server.
 *
 * This is useful when a CSRF validation fails (403 response), indicating
 * the cached token may be stale or invalid.
 *
 * @example
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: { 'x-csrf-token': await getCsrfToken() }
 * });
 *
 * if (response.status === 403) {
 *   // Token may be stale, clear cache and retry
 *   clearCsrfToken();
 *   const newToken = await getCsrfToken();
 *   // Retry request with new token...
 * }
 */
export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

/**
 * Creates headers object with CSRF token included.
 * Fetches the token if not already cached.
 *
 * This is a convenience function that combines token fetching with header
 * creation, simplifying the common pattern of adding CSRF tokens to requests.
 *
 * @param additionalHeaders - Optional additional headers to include
 * @returns Promise resolving to Headers object with CSRF token
 *
 * @example
 * const headers = await getCsrfHeaders();
 * await fetch('/api/sessions/abc123', {
 *   method: 'DELETE',
 *   headers
 * });
 *
 * @example
 * const headers = await getCsrfHeaders({
 *   'Content-Type': 'application/json'
 * });
 * await fetch('/api/sessions', {
 *   method: 'POST',
 *   headers,
 *   body: JSON.stringify(data)
 * });
 */
export async function getCsrfHeaders(
  additionalHeaders: Record<string, string> = {}
): Promise<Headers> {
  const token = await getCsrfToken();
  const headers = new Headers(additionalHeaders);

  if (token) {
    headers.set('x-csrf-token', token);
  }

  return headers;
}
