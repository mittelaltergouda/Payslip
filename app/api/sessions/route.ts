// ============================================================================
// SESSIONS API ENDPOINTS
// ============================================================================
// GET: Retrieves all sessions from the database with essential metadata
// POST: Creates a new session with members (primarily for testing)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/errors";

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
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 *
 * Creates a new session with members. Primarily used for E2E testing.
 *
 * Request body:
 * - name: Session name
 * - type: SessionType (TRADING, PIRACY, SALVAGE, MINING, BOUNTY, OTHER)
 * - taxEnabled: Boolean for tax calculations
 * - distribution: DistributionMode (EQUAL, PERCENT, ADJUSTABLE)
 * - members: Array of member objects with handle, role, revenue, investment
 *
 * @returns 200 OK with created session object, or error response
 *
 * Error responses:
 * - 400 Bad Request: Invalid input data
 * - 500 Internal Server Error: Database creation failure
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, taxEnabled, distribution, members } = body;

    // Validate required fields
    if (!name || !type || !distribution || !Array.isArray(members)) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, distribution, members" },
        { status: 400 }
      );
    }

    // Calculate total revenue from members
    const totalRevenue = members.reduce((sum: number, member: any) => sum + (member.revenue || 0), 0);

    // Create session with members
    const session = await prisma.session.create({
      data: {
        name,
        type,
        taxEnabled: taxEnabled ?? true,
        totalRevenue,
        distributionMode: distribution,
        members: {
          create: members.map((member: any) => ({
            handle: member.handle,
            role: member.role || null,
            revenue: member.revenue || 0,
            investment: member.investment || 0,
            active: member.active ?? true,
            percentShare: member.percentShare || null,
            fixedBonus: member.fixedBonus || null,
            fixedPayout: member.fixedPayout || null,
          }))
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}
