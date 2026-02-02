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
      if (nonce) nonces.add(nonce);
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
});
