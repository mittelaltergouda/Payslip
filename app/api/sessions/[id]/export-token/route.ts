// ============================================================================
// EXPORT TOKEN API ENDPOINT
// ============================================================================
// This endpoint generates secure export tokens for shareable read-only
// session links. Uses cryptographically secure token generation.

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken } from "@/lib/crypto";
import { exportTokenSchema, sessionIdParamSchema } from "@/app/api/sessions/validation";
import { Prisma } from "@prisma/client";
import { extractCsrfTokenFromHeaders, validateCsrfToken } from "@/lib/csrf";
import { sanitizeError } from "@/lib/errors";

/**
 * POST /api/sessions/[id]/export-token
 *
 * Generates a new export token for sharing a session via read-only link.
 *
 * Security features:
 * - CSRF protection via token validation (prevents cross-site request forgery)
 * - Cryptographically secure token generation (256 bits entropy)
 * - Unique token constraint enforced at database level
 * - URL-safe base64 encoding for use in share links
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing session ID
 * @returns 201 Created with token data, or error response
 *
 * Error responses:
 * - 400 Bad Request: Invalid session ID format (must be UUID)
 * - 403 Forbidden: Invalid or missing CSRF token
 * - 404 Not Found: Session does not exist
 * - 409 Conflict: Token collision (extremely rare, retry suggested)
 * - 500 Internal Server Error: Database or validation error
 *
 * @example
 * POST /api/sessions/abc123/export-token
 * Response: {
 *   "id": "token-uuid",
 *   "sessionId": "abc123",
 *   "token": "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i",
 *   "expiresAt": "2026-03-11T12:34:56.789Z",
 *   "shareUrl": "/session/kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i"
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract session ID from route parameters
    const { id: sessionId } = await context.params;

    // Validate session ID format (must be a valid UUID)
    const validation = sessionIdParamSchema.safeParse({ id: sessionId });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid session ID format",
          details: validation.error.errors[0].message
        },
        { status: 400 }
      );
    }

    // CSRF Protection: Double-Submit Cookie Pattern
    const clientToken = extractCsrfTokenFromHeaders(request.headers);
    const cookieToken = request.cookies.get('csrf-token')?.value;

    if (!validateCsrfToken(clientToken, cookieToken)) {
      return NextResponse.json(
        {
          error: "CSRF token validation failed",
          details: "Invalid or missing CSRF token"
        },
        { status: 403 }
      );
    }

    // Validate session exists before generating token
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found", sessionId },
        { status: 404 }
      );
    }

    // Generate cryptographically secure token
    const token = generateSecureToken();

    // Calculate expiration date (default 30 days from now)
    const expirationDays = parseInt(process.env.EXPORT_TOKEN_EXPIRATION_DAYS ?? "30", 10);
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // Create export token record in database
    // The token field has a @unique constraint to prevent collisions
    const exportToken = await prisma.exportToken.create({
      data: {
        sessionId,
        token,
        expiresAt
      }
    });

    // Validate response data against schema (optional safety check)
    const validatedToken = exportTokenSchema.parse({
      id: exportToken.id,
      sessionId: exportToken.sessionId,
      token: exportToken.token,
      expiresAt: exportToken.expiresAt?.toISOString() ?? null
    });

    // Return token with share URL for convenience
    return NextResponse.json(
      {
        ...validatedToken,
        shareUrl: `/session/${exportToken.token}`
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle unique constraint violation (token collision)
    // This is extremely unlikely with 256-bit random tokens (~10^-77 probability)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Token collision detected. Please retry.",
          details: "A unique token could not be generated (extremely rare)"
        },
        { status: 409 }
      );
    }

    // Handle validation errors from Zod schema
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: sanitizeError(error) },
        { status: 400 }
      );
    }

    // Log unexpected errors for debugging
    console.error("Export token generation error:", error);

    // Return generic error response
    return NextResponse.json(
      {
        error: "Failed to generate export token",
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}
