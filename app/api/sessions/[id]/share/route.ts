// ============================================================================
// SHARE API ENDPOINT
// ============================================================================
// This endpoint generates secure share tokens for read-only session links.
// Uses the same token generation mechanism as export-token but returns
// the correct share URL format for the /share/[token] page route.

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken } from "@/lib/crypto";
import { exportTokenSchema } from "@/app/api/sessions/validation";
import { Prisma } from "@prisma/client";

/**
 * POST /api/sessions/[id]/share
 *
 * Generates a new share token for read-only access to a session's payslip results.
 *
 * Security features:
 * - Cryptographically secure token generation (256 bits entropy)
 * - Unique token constraint enforced at database level
 * - URL-safe base64 encoding for use in share links
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing session ID
 * @returns 201 Created with token data and share URL, or error response
 *
 * Error responses:
 * - 404 Not Found: Session does not exist
 * - 409 Conflict: Token collision (extremely rare, retry suggested)
 * - 500 Internal Server Error: Database or validation error
 *
 * @example
 * POST /api/sessions/abc123/share
 * Response: {
 *   "id": "token-uuid",
 *   "sessionId": "abc123",
 *   "token": "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i",
 *   "expiresAt": null,
 *   "shareUrl": "/share/kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i"
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract session ID from route parameters
    const { id: sessionId } = await context.params;

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

    // Create export token record in database
    // The token field has a @unique constraint to prevent collisions
    const exportToken = await prisma.exportToken.create({
      data: {
        sessionId,
        token,
        expiresAt: null // No expiration by default
      }
    });

    // Validate response data against schema (optional safety check)
    const validatedToken = exportTokenSchema.parse({
      id: exportToken.id,
      sessionId: exportToken.sessionId,
      token: exportToken.token,
      expiresAt: exportToken.expiresAt?.toISOString() ?? null
    });

    // Return token with share URL pointing to /share/[token] page
    return NextResponse.json(
      {
        ...validatedToken,
        shareUrl: `/share/${exportToken.token}`
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
        { error: "Validation error", details: error.message },
        { status: 400 }
      );
    }

    // Log unexpected errors for debugging
    console.error("Share token generation error:", error);

    // Return generic error response
    return NextResponse.json(
      {
        error: "Failed to generate share token",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
