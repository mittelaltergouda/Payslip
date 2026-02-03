// ============================================================================
// SHARE TOKEN FETCH API ENDPOINT
// ============================================================================
// This endpoint retrieves session data using a share token for read-only
// access. Validates the token, returns the full session with all relations,
// and calculates the payslip for immediate display.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayslip } from "@/lib/calc";
import type { SessionInput } from "@/lib/types";

/**
 * GET /api/share/[token]
 *
 * Fetches session data by share token for read-only access.
 *
 * Security features:
 * - Token-based authentication (no user credentials required)
 * - Returns read-only session data
 * - Validates token existence and expiration
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing share token
 * @returns 200 OK with session data, or error response
 *
 * Error responses:
 * - 404 Not Found: Token does not exist or has expired
 * - 500 Internal Server Error: Database error
 *
 * @example
 * GET /api/share/kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i
 * Response: {
 *   "session": {
 *     "id": "session-uuid",
 *     "name": "Mining Op Alpha",
 *     "type": "MINING",
 *     "currency": "aUEC",
 *     "totalRevenue": 500000,
 *     "taxEnabled": true,
 *     "taxRate": "0.0050",
 *     "distributionMode": "EQUAL",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "members": [...],
 *     "sharedExpenses": [...],
 *     "individualExpense": [...]
 *   },
 *   "payslip": {
 *     "saleRevenue": 450000,
 *     "netProfit": 400000,
 *     "taxRateApplied": 0.005,
 *     "members": [...],
 *     "suggestedTransfers": [...],
 *     "summaryStatistics": {...}
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    // Extract token from route parameters
    const { token } = await context.params;

    // Look up the export token and verify it exists
    const exportToken = await prisma.exportToken.findUnique({
      where: { token },
      select: {
        id: true,
        sessionId: true,
        expiresAt: true
      }
    });

    if (!exportToken) {
      return NextResponse.json(
        { error: "Share token not found", token },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (exportToken.expiresAt && exportToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Share token has expired", token },
        { status: 404 }
      );
    }

    // Fetch the full session with all relations
    const session = await prisma.session.findUnique({
      where: { id: exportToken.sessionId },
      include: {
        members: {
          include: {
            individual: true,
            shared: {
              include: {
                sharedExpense: true
              }
            }
          }
        },
        sharedExpenses: {
          include: {
            members: {
              include: {
                member: true
              }
            }
          }
        },
        individualExpense: {
          include: {
            member: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found for this token", sessionId: exportToken.sessionId },
        { status: 404 }
      );
    }

    // Transform session data to SessionInput format for calculation
    const sessionInput: SessionInput = {
      id: session.id,
      name: session.name,
      type: session.type,
      currency: session.currency,
      totalRevenue: session.totalRevenue,
      distributionMode: session.distributionMode,
      taxEnabled: session.taxEnabled,
      taxRate: Number(session.taxRate),
      members: session.members.map((member) => ({
        id: member.id,
        handle: member.handle,
        role: member.role ?? undefined,
        active: member.active,
        revenue: member.revenue,
        investment: member.investment,
        percentShare: member.percentShare ? Number(member.percentShare) : null,
        fixedBonus: member.fixedBonus ?? null,
        fixedPayout: member.fixedPayout ?? null
      })),
      sharedExpenses: session.sharedExpenses.map((expense) => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        participantIds: expense.members.map((m) => m.memberId)
      })),
      individualExpenses: session.individualExpense.map((expense) => ({
        id: expense.id,
        memberId: expense.memberId,
        label: expense.label,
        amount: expense.amount
      }))
    };

    // Calculate payslip results
    const payslip = calculatePayslip(sessionInput);

    // Return session data with calculated payslip
    return NextResponse.json(
      {
        session,
        payslip
      },
      { status: 200 }
    );
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Share token fetch error:", error);

    // Return generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch session data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
