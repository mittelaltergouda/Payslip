// ============================================================================
// SESSION DELETE API ENDPOINT
// ============================================================================
// This endpoint deletes a session and all its related data.
// Cascade deletes are configured in Prisma schema for Members, SharedExpenses,
// IndividualExpenses, and ExportTokens.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractCsrfTokenFromHeaders, validateCsrfToken } from "@/lib/csrf";
import { sessionIdParamSchema } from "@/app/api/sessions/validation";
import { sanitizeError } from "@/lib/errors";

/**
 * DELETE /api/sessions/[id]
 *
 * Deletes a session and all its associated data via cascade delete.
 *
 * Security features:
 * - CSRF protection via token validation (prevents cross-site request forgery)
 *
 * Cascade behavior:
 * - All members associated with the session are deleted
 * - All shared expenses associated with the session are deleted
 * - All individual expenses associated with the session are deleted
 * - All export tokens associated with the session are deleted
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing session ID
 * @returns 200 OK with deletion confirmation, or error response
 *
 * Error responses:
 * - 400 Bad Request: Invalid session ID format (must be UUID)
 * - 403 Forbidden: Invalid or missing CSRF token
 * - 404 Not Found: Session does not exist
 * - 500 Internal Server Error: Database error during deletion
 *
 * @example
 * DELETE /api/sessions/abc123
 * Response: {
 *   "success": true,
 *   "sessionId": "abc123",
 *   "message": "Session deleted successfully"
 * }
 */
export async function DELETE(
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

    // Validate session exists before attempting deletion
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

    // Delete the session (cascade deletes handle related records)
    await prisma.session.delete({
      where: { id: sessionId }
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        sessionId,
        message: "Session deleted successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Session deletion error:", error);

    // Return generic error response
    return NextResponse.json(
      {
        error: "Failed to delete session",
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}
