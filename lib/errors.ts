// ============================================================================
// ERROR SANITIZATION UTILITIES
// ============================================================================
// This module provides error sanitization utilities for API responses
// to prevent information disclosure while maintaining server-side logging.

/**
 * Sanitizes error objects for safe client exposure by removing sensitive
 * implementation details, stack traces, file paths, and database schema
 * information that could be exploited by attackers.
 *
 * Security properties:
 * - Prevents stack trace exposure
 * - Removes file paths and line numbers
 * - Hides database schema details (Prisma errors)
 * - Obscures library version information
 * - Preserves error categorization (validation vs server errors)
 * - Maintains user-friendly error messages
 *
 * The original detailed error should still be logged server-side via
 * console.error() before calling this function, ensuring debugging
 * information is available without exposing it to clients.
 *
 * @param error - The error object to sanitize (Error, Prisma error, Zod error, or unknown)
 * @returns Sanitized error message safe for client consumption
 *
 * @example
 * // Standard Error object
 * try {
 *   throw new Error("Database connection failed: ECONNREFUSED at db.ts:42");
 * } catch (error) {
 *   console.error("Database error:", error); // Log detailed error server-side
 *   return NextResponse.json(
 *     { error: "Operation failed", details: sanitizeError(error) },
 *     { status: 500 }
 *   );
 * }
 * // Response: { error: "Operation failed", details: "An unexpected error occurred" }
 *
 * @example
 * // Prisma unique constraint violation (P2002)
 * try {
 *   await prisma.session.create({ data: { shareToken: existingToken } });
 * } catch (error) {
 *   console.error("Prisma error:", error);
 *   return NextResponse.json(
 *     { error: "Creation failed", details: sanitizeError(error) },
 *     { status: 409 }
 *   );
 * }
 * // Response: { error: "Creation failed", details: "Resource already exists" }
 *
 * @example
 * // Zod validation error
 * try {
 *   schema.parse(invalidData);
 * } catch (error) {
 *   console.error("Validation error:", error);
 *   return NextResponse.json(
 *     { error: "Validation failed", details: sanitizeError(error) },
 *     { status: 400 }
 *   );
 * }
 * // Response: { error: "Validation failed", details: "Invalid request data" }
 *
 * @example
 * // Unknown error type (null, undefined, string, number)
 * try {
 *   someLegacyCode(); // Might throw anything
 * } catch (error) {
 *   console.error("Unknown error:", error);
 *   return NextResponse.json(
 *     { error: "Operation failed", details: sanitizeError(error) },
 *     { status: 500 }
 *   );
 * }
 * // Response: { error: "Operation failed", details: "An unexpected error occurred" }
 */
export function sanitizeError(error: unknown): string {
  // Handle null or undefined
  if (error == null) {
    return "An unexpected error occurred";
  }

  // Handle Prisma errors (identified by error.code property)
  // Prisma errors have specific error codes like P2002, P2025, etc.
  if (typeof error === "object" && "code" in error) {
    const prismaError = error as { code?: string };

    // P2002: Unique constraint violation
    if (prismaError.code === "P2002") {
      return "Resource already exists";
    }

    // P2025: Record not found
    if (prismaError.code === "P2025") {
      return "Resource not found";
    }

    // P2003: Foreign key constraint violation
    if (prismaError.code === "P2003") {
      return "Invalid reference to related resource";
    }

    // Other Prisma errors - generic database error message
    if (typeof prismaError.code === "string" && prismaError.code.startsWith("P")) {
      return "Database operation failed";
    }
  }

  // Handle Zod validation errors (identified by error.name === "ZodError")
  if (
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    return "Invalid request data";
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // For standard errors, we return a generic message
    // The actual error.message should be logged server-side before calling this function
    return "An unexpected error occurred";
  }

  // Handle primitive types (string, number, boolean)
  if (typeof error === "string") {
    // Even string errors might contain sensitive information
    return "An unexpected error occurred";
  }

  // Handle any other unknown types
  return "An unexpected error occurred";
}
