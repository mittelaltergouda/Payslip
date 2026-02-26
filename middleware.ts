import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { generateCsrfToken } from "./lib/csrf";

export function middleware(request: NextRequest) {
  // Generate a unique nonce for this request
  const nonce = crypto.randomUUID();

  // Generate a CSRF token for this request
  const csrfToken = generateCsrfToken();

  // Create Content-Security-Policy header with nonce
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  // Clone the request headers and add CSP nonce (NOT CSRF token - security requirement)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Create response with updated headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP header on response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);
  response.headers.set("x-csrf-token", csrfToken);

  // Set CSRF token in HTTP-only cookie (double-submit cookie pattern)
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  // Set static security headers (also in next.config.mjs for production)
  // These are duplicated here to ensure they work in development mode
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

// Apply middleware to all routes
export const config = {
  runtime: 'nodejs', // Fix: Edge runtime doesn't support Node.js crypto
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
