// ============================================================================
// SESSIONS LIST API ENDPOINT
// ============================================================================
// This endpoint retrieves all sessions from the database with essential
// metadata for displaying in the session history view.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sessions
 *
 * Retrieves all sessions with metadata for the session history view.
 *
 * Response includes:
 * - Basic session fields (id, name, type, createdAt, totalRevenue)
 * - Member count via Prisma's _count relation aggregation
 * - Sessions sorted by creation date (newest first)
 *
 * @returns 200 OK with array of session objects, or error response
 *
 * Error responses:
 * - 500 Internal Server Error: Database query failure
 *
 * @example
 * GET /api/sessions
 * Response: [
 *   {
 *     "id": "abc123",
 *     "name": "Mining Session 2024-01-15",
 *     "type": "MINING",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "totalRevenue": 150000,
 *     "memberCount": 4
 *   },
 *   ...
 * ]
 */
export async function GET() {
  try {
    // Fetch all sessions with member count, sorted by creation date descending
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        totalRevenue: true,
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Transform response to flatten _count into memberCount
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      name: session.name,
      type: session.type,
      createdAt: session.createdAt.toISOString(),
      totalRevenue: session.totalRevenue,
      memberCount: session._count.members
    }));

    return NextResponse.json(formattedSessions, { status: 200 });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Session list fetch error:", error);

    // Return generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch sessions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
