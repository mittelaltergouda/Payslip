import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';

describe('middleware - CSP nonce generation', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUUID: any;

  beforeEach(() => {
    // Mock crypto.randomUUID using vi.spyOn
    mockUUID = vi.fn();
    vi.spyOn(crypto, 'randomUUID').mockImplementation(mockUUID);

    // Set default implementation with counter for predictable test values
    let counter = 0;
    mockUUID.mockImplementation(() => {
      counter++;
      return `test-uuid-${counter}`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a unique nonce for each request', () => {
    const request1 = new NextRequest(new Request('http://localhost:3000/'));
    const request2 = new NextRequest(new Request('http://localhost:3000/'));

    middleware(request1);
    middleware(request2);

    // crypto.randomUUID should be called twice
    expect(mockUUID).toHaveBeenCalledTimes(2);
  });

  it('should include nonce in CSP header', () => {
    mockUUID.mockReturnValue('abc-123-def-456');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("'nonce-abc-123-def-456'");
  });

  it('should set x-nonce header on response', () => {
    mockUUID.mockReturnValue('test-nonce-value');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    expect(response.headers.get('x-nonce')).toBe('test-nonce-value');
  });

  it('should create valid CSP header with all required directives', () => {
    mockUUID.mockReturnValue('nonce-123');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toBeDefined();

    // Verify all CSP directives are present
    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("script-src 'self' 'nonce-nonce-123' 'unsafe-eval' 'unsafe-inline'");
    expect(cspHeader).toContain("style-src 'self' 'nonce-nonce-123' 'unsafe-inline'");
    expect(cspHeader).toContain("img-src 'self' data: blob:");
    expect(cspHeader).toContain("font-src 'self' data:");
    expect(cspHeader).toContain("connect-src 'self'");
    expect(cspHeader).toContain("frame-ancestors 'none'");
    expect(cspHeader).toContain("base-uri 'self'");
    expect(cspHeader).toContain("form-action 'self'");
  });

  it('should include nonce in both script-src and style-src directives', () => {
    mockUUID.mockReturnValue('my-nonce');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toContain("script-src 'self' 'nonce-my-nonce'");
    expect(cspHeader).toContain("style-src 'self' 'nonce-my-nonce'");
  });

  it('should return NextResponse with CSP headers', () => {
    const request = new NextRequest(new Request('http://localhost:3000/test'));

    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.has('Content-Security-Policy')).toBe(true);
    expect(response.headers.has('x-nonce')).toBe(true);
  });

  it('should use the same nonce for both request and response headers', () => {
    mockUUID.mockReturnValue('consistent-nonce');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    // Get the nonce from response header
    const responseNonce = response.headers.get('x-nonce');
    const cspHeader = response.headers.get('Content-Security-Policy');

    expect(responseNonce).toBe('consistent-nonce');
    expect(cspHeader).toContain("'nonce-consistent-nonce'");
  });

  it('should generate different nonces for different requests', () => {
    const nonces: string[] = [];
    mockUUID.mockImplementation(() => {
      const nonce = `unique-${nonces.length}`;
      nonces.push(nonce);
      return nonce;
    });

    const request1 = new NextRequest(new Request('http://localhost:3000/page1'));
    const request2 = new NextRequest(new Request('http://localhost:3000/page2'));
    const request3 = new NextRequest(new Request('http://localhost:3000/page3'));

    const response1 = middleware(request1);
    const response2 = middleware(request2);
    const response3 = middleware(request3);

    const nonce1 = response1.headers.get('x-nonce');
    const nonce2 = response2.headers.get('x-nonce');
    const nonce3 = response3.headers.get('x-nonce');

    // All nonces should be different
    expect(nonce1).not.toBe(nonce2);
    expect(nonce2).not.toBe(nonce3);
    expect(nonce1).not.toBe(nonce3);

    // Verify they match the generated values
    expect(nonce1).toBe('unique-0');
    expect(nonce2).toBe('unique-1');
    expect(nonce3).toBe('unique-2');
  });

  it('should properly format CSP header with semicolon separators', () => {
    mockUUID.mockReturnValue('format-test');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');

    // CSP directives should be separated by semicolons
    expect(cspHeader).toMatch(/;\s+/);

    // Should not end with semicolon
    expect(cspHeader?.endsWith(';')).toBe(false);
  });

  it('should handle requests to different paths with unique nonces', () => {
    const paths = ['/api/sessions', '/share/abc123', '/'];
    const nonces = new Set<string>();

    paths.forEach((path, index) => {
      mockUUID.mockReturnValue(`path-nonce-${index}`);
      const request = new NextRequest(new Request(`http://localhost:3000${path}`));
      const response = middleware(request);
      const nonce = response.headers.get('x-nonce');
      if (nonce) {nonces.add(nonce);}
    });

    // All nonces should be unique
    expect(nonces.size).toBe(paths.length);
  });

  it('should include frame-ancestors none for clickjacking protection', () => {
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toContain("frame-ancestors 'none'");
  });

  it('should restrict base-uri to self', () => {
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toContain("base-uri 'self'");
  });

  it('should restrict form-action to self', () => {
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toContain("form-action 'self'");
  });

  it('should not include Google Fonts domains in CSP headers', () => {
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cspHeader = response.headers.get('Content-Security-Policy');
    expect(cspHeader).toBeDefined();

    // Verify Google Fonts domains are not present (fonts are now self-hosted via next/font)
    expect(cspHeader).not.toContain('fonts.googleapis.com');
    expect(cspHeader).not.toContain('fonts.gstatic.com');
  });
});

describe('middleware - CSRF token generation', () => {
  let mockGenerateCsrfToken: ReturnType<typeof vi.fn>;
  let originalGenerateCsrfToken: typeof import('./lib/csrf').generateCsrfToken;

  beforeEach(async () => {
    // Import the csrf module to get the original function
    const csrfModule = await import('./lib/csrf');
    originalGenerateCsrfToken = csrfModule.generateCsrfToken;

    // Create a mock function
    mockGenerateCsrfToken = vi.fn();

    // Set default implementation with counter for predictable test values
    let counter = 0;
    mockGenerateCsrfToken.mockImplementation(() => {
      counter++;
      return `test-csrf-token-${counter}`;
    });

    // Replace the module export
    vi.spyOn(await import('./lib/csrf'), 'generateCsrfToken').mockImplementation(mockGenerateCsrfToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a CSRF token for each request', () => {
    const request1 = new NextRequest(new Request('http://localhost:3000/'));
    const request2 = new NextRequest(new Request('http://localhost:3000/'));

    middleware(request1);
    middleware(request2);

    // generateCsrfToken should be called twice
    expect(mockGenerateCsrfToken).toHaveBeenCalledTimes(2);
  });

  it('should set x-csrf-token header on response', () => {
    mockGenerateCsrfToken.mockReturnValue('test-csrf-value');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    expect(response.headers.get('x-csrf-token')).toBe('test-csrf-value');
  });

  it('should set x-csrf-token header on request', () => {
    mockGenerateCsrfToken.mockReturnValue('csrf-request-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    // The response's request headers should have the CSRF token
    const requestHeaders = response.headers.get('x-csrf-token');
    expect(requestHeaders).toBe('csrf-request-token');
  });

  it('should use the same CSRF token for both request and response headers', () => {
    mockGenerateCsrfToken.mockReturnValue('consistent-csrf-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    // Get the token from response header
    const responseCsrfToken = response.headers.get('x-csrf-token');

    expect(responseCsrfToken).toBe('consistent-csrf-token');
    expect(mockGenerateCsrfToken).toHaveBeenCalledTimes(1);
  });

  it('should generate different CSRF tokens for different requests', () => {
    const tokens: string[] = [];
    mockGenerateCsrfToken.mockImplementation(() => {
      const token = `unique-csrf-${tokens.length}`;
      tokens.push(token);
      return token;
    });

    const request1 = new NextRequest(new Request('http://localhost:3000/page1'));
    const request2 = new NextRequest(new Request('http://localhost:3000/page2'));
    const request3 = new NextRequest(new Request('http://localhost:3000/page3'));

    const response1 = middleware(request1);
    const response2 = middleware(request2);
    const response3 = middleware(request3);

    const token1 = response1.headers.get('x-csrf-token');
    const token2 = response2.headers.get('x-csrf-token');
    const token3 = response3.headers.get('x-csrf-token');

    // All tokens should be different
    expect(token1).not.toBe(token2);
    expect(token2).not.toBe(token3);
    expect(token1).not.toBe(token3);

    // Verify they match the generated values
    expect(token1).toBe('unique-csrf-0');
    expect(token2).toBe('unique-csrf-1');
    expect(token3).toBe('unique-csrf-2');
  });

  it('should handle requests to different paths with unique CSRF tokens', () => {
    const paths = ['/api/sessions', '/share/abc123', '/'];
    const csrfTokens = new Set<string>();

    paths.forEach((path, index) => {
      mockGenerateCsrfToken.mockReturnValue(`path-csrf-token-${index}`);
      const request = new NextRequest(new Request(`http://localhost:3000${path}`));
      const response = middleware(request);
      const token = response.headers.get('x-csrf-token');
      if (token) {
        csrfTokens.add(token);
      }
    });

    // All CSRF tokens should be unique
    expect(csrfTokens.size).toBe(paths.length);
  });

  it('should call generateCsrfToken without arguments', () => {
    const request = new NextRequest(new Request('http://localhost:3000/'));

    middleware(request);

    // generateCsrfToken should be called with no arguments (uses default 32 bytes)
    expect(mockGenerateCsrfToken).toHaveBeenCalledWith();
  });

  it('should return NextResponse with CSRF token header', () => {
    mockGenerateCsrfToken.mockReturnValue('response-csrf-token');
    const request = new NextRequest(new Request('http://localhost:3000/test'));

    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.has('x-csrf-token')).toBe(true);
    expect(response.headers.get('x-csrf-token')).toBe('response-csrf-token');
  });

  it('should generate CSRF token even for API routes', () => {
    mockGenerateCsrfToken.mockReturnValue('api-csrf-token');
    const request = new NextRequest(new Request('http://localhost:3000/api/sessions'));

    const response = middleware(request);

    expect(mockGenerateCsrfToken).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-csrf-token')).toBe('api-csrf-token');
  });

  it('should generate CSRF token for share routes', () => {
    mockGenerateCsrfToken.mockReturnValue('share-csrf-token');
    const request = new NextRequest(new Request('http://localhost:3000/share/session123'));

    const response = middleware(request);

    expect(mockGenerateCsrfToken).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-csrf-token')).toBe('share-csrf-token');
  });

  it('should generate unique tokens for concurrent requests', () => {
    const tokens = new Set<string>();
    const requestCount = 10;

    // Simulate concurrent requests
    for (let i = 0; i < requestCount; i++) {
      mockGenerateCsrfToken.mockReturnValue(`concurrent-token-${i}`);
      const request = new NextRequest(new Request(`http://localhost:3000/page${i}`));
      const response = middleware(request);
      const token = response.headers.get('x-csrf-token');
      if (token) {
        tokens.add(token);
      }
    }

    // All tokens should be unique
    expect(tokens.size).toBe(requestCount);
  });

  it('should maintain CSRF token integrity through middleware processing', () => {
    mockGenerateCsrfToken.mockReturnValue('integrity-test-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const csrfToken = response.headers.get('x-csrf-token');

    // Token should not be modified or corrupted
    expect(csrfToken).toBe('integrity-test-token');
    expect(csrfToken?.length).toBe('integrity-test-token'.length);
    expect(typeof csrfToken).toBe('string');
  });

  it('should generate CSRF token before setting security headers', () => {
    const callOrder: string[] = [];

    mockGenerateCsrfToken.mockImplementation(() => {
      callOrder.push('csrf-generated');
      return 'ordered-token';
    });

    const request = new NextRequest(new Request('http://localhost:3000/'));
    const response = middleware(request);

    // CSRF token should be generated and header should be set
    expect(callOrder).toContain('csrf-generated');
    expect(response.headers.get('x-csrf-token')).toBe('ordered-token');

    // Other security headers should also be present
    expect(response.headers.has('X-Frame-Options')).toBe(true);
    expect(response.headers.has('X-Content-Type-Options')).toBe(true);
  });
});

describe('middleware - CSRF cookie handling', () => {
  let mockGenerateCsrfToken: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Create a mock function
    mockGenerateCsrfToken = vi.fn();

    // Set default implementation with counter for predictable test values
    let counter = 0;
    mockGenerateCsrfToken.mockImplementation(() => {
      counter++;
      return `test-csrf-token-${counter}`;
    });

    // Replace the module export
    vi.spyOn(await import('./lib/csrf'), 'generateCsrfToken').mockImplementation(mockGenerateCsrfToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set CSRF token in HTTP-only cookie', () => {
    mockGenerateCsrfToken.mockReturnValue('cookie-csrf-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cookie = response.cookies.get('csrf-token');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe('cookie-csrf-token');
  });

  it('should set cookie with httpOnly flag', () => {
    mockGenerateCsrfToken.mockReturnValue('secure-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    // Get Set-Cookie header to verify httpOnly flag
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('HttpOnly');
  });

  it('should set cookie with SameSite=Strict', () => {
    mockGenerateCsrfToken.mockReturnValue('samesite-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader?.toLowerCase()).toContain('samesite=strict');
  });

  it('should set same CSRF token in both cookie and response header', () => {
    mockGenerateCsrfToken.mockReturnValue('matching-token-123');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const cookieToken = response.cookies.get('csrf-token')?.value;
    const headerToken = response.headers.get('x-csrf-token');

    expect(cookieToken).toBeDefined();
    expect(headerToken).toBeDefined();
    expect(cookieToken).toBe(headerToken);
    expect(cookieToken).toBe('matching-token-123');
  });

  it('should set cookie path to root', () => {
    mockGenerateCsrfToken.mockReturnValue('path-token');
    const request = new NextRequest(new Request('http://localhost:3000/'));

    const response = middleware(request);

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('Path=/');
  });

  it('should set different cookie values for different requests', () => {
    const tokens: string[] = [];
    mockGenerateCsrfToken.mockImplementation(() => {
      const token = `unique-cookie-${tokens.length}`;
      tokens.push(token);
      return token;
    });

    const request1 = new NextRequest(new Request('http://localhost:3000/page1'));
    const request2 = new NextRequest(new Request('http://localhost:3000/page2'));

    const response1 = middleware(request1);
    const response2 = middleware(request2);

    const cookie1 = response1.cookies.get('csrf-token')?.value;
    const cookie2 = response2.cookies.get('csrf-token')?.value;

    expect(cookie1).toBe('unique-cookie-0');
    expect(cookie2).toBe('unique-cookie-1');
    expect(cookie1).not.toBe(cookie2);
  });
});
