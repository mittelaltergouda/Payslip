// ============================================================================
// SHARE API INTEGRATION TESTS
// ============================================================================
// Integration tests for POST /api/sessions/[id]/share and GET /api/share/[token]
// Tests token generation, session fetching, payslip calculation, and error handling

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/sessions/[id]/share/route";
import { GET } from "@/app/api/share/[token]/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePayslip } from "@/lib/calc";
import { Prisma } from "@prisma/client";
import type { SessionInput, Payslip } from "@/lib/types";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn()
    },
    exportToken: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

// Mock calculatePayslip function
vi.mock("@/lib/calc", () => ({
  calculatePayslip: vi.fn()
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockShareRequest(sessionId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/sessions/${sessionId}/share`, {
    method: "POST"
  });
}

function createMockShareContext(sessionId: string) {
  return {
    params: Promise.resolve({ id: sessionId })
  };
}

function createMockTokenRequest(token: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/share/${token}`, {
    method: "GET"
  });
}

function createMockTokenContext(token: string) {
  return {
    params: Promise.resolve({ token })
  };
}

// ============================================================================
// POST /api/sessions/[id]/share TESTS
// ============================================================================

describe("POST /api/sessions/[id]/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Success Cases", () => {
    it("should successfully create share token for valid session", async () => {
      const sessionId = "test-session-123";
      const mockSession = { id: sessionId };
      const mockToken = "kJ8x-3mQfYz2vN4pL6rW9sU1tH5qD7cA8bE0gF2hG4i";
      const mockExportToken = {
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: null
      };

      // Mock session exists
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      // Mock token creation
      vi.mocked(prisma.exportToken.create).mockResolvedValue(mockExportToken as any);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: null,
        shareUrl: `/share/${mockToken}`
      });

      // Verify database calls
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        select: { id: true }
      });

      expect(prisma.exportToken.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          token: expect.any(String),
          expiresAt: null
        }
      });
    });

    it("should generate cryptographically secure token", async () => {
      const sessionId = "test-session-456";
      const mockSession = { id: sessionId };
      let capturedToken = "";

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockImplementation((args: any) => {
        capturedToken = args.data.token;
        return Promise.resolve({
          id: "token-uuid",
          sessionId,
          token: capturedToken,
          expiresAt: null
        } as any);
      });

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      await POST(request, context);

      // Token should be 43 characters (32 bytes base64url encoded)
      expect(capturedToken).toHaveLength(43);

      // Token should be URL-safe (base64url: only A-Za-z0-9_-)
      expect(capturedToken).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should create multiple unique tokens for the same session", async () => {
      const sessionId = "test-session-789";
      const mockSession = { id: sessionId };
      const generatedTokens: string[] = [];

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockImplementation((args: any) => {
        const token = args.data.token;
        generatedTokens.push(token);
        return Promise.resolve({
          id: `token-uuid-${generatedTokens.length}`,
          sessionId,
          token,
          expiresAt: null
        } as any);
      });

      // Generate 3 tokens for the same session
      for (let i = 0; i < 3; i++) {
        const request = createMockShareRequest(sessionId);
        const context = createMockShareContext(sessionId);
        await POST(request, context);
      }

      // All tokens should be unique
      expect(generatedTokens.length).toBe(3);
      expect(new Set(generatedTokens).size).toBe(3);
    });

    it("should include correct shareUrl format (/share/[token])", async () => {
      const sessionId = "test-session-url";
      const mockSession = { id: sessionId };
      const mockToken = "abc123-xyz789_test";

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: mockToken,
        expiresAt: null
      } as any);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();
      expect(data.shareUrl).toBe(`/share/${mockToken}`);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 when session does not exist", async () => {
      const sessionId = "non-existent-session";

      // Mock session not found
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Session not found",
        sessionId
      });

      // exportToken.create should not be called
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should return 409 on token collision (P2002 error)", async () => {
      const sessionId = "test-session-collision";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      // Mock unique constraint violation (P2002)
      const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.18.0"
        }
      );

      vi.mocked(prisma.exportToken.create).mockRejectedValue(uniqueConstraintError);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Token collision detected. Please retry.",
        details: "A unique token could not be generated (extremely rare)"
      });
    });

    it("should return 500 on database error", async () => {
      const sessionId = "test-session-db-error";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(new Error("Database connection error"));

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Failed to generate share token",
        details: "Database connection error"
      });
    });
  });

  describe("Response Format", () => {
    it("should return correct response structure", async () => {
      const sessionId = "test-session-structure";
      const mockSession = { id: sessionId };
      const mockToken = "test-token-structure";

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: null
      } as any);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();

      // Verify all expected fields are present
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("sessionId");
      expect(data).toHaveProperty("token");
      expect(data).toHaveProperty("expiresAt");
      expect(data).toHaveProperty("shareUrl");

      // Verify field types
      expect(typeof data.id).toBe("string");
      expect(typeof data.sessionId).toBe("string");
      expect(typeof data.token).toBe("string");
      expect(data.expiresAt).toBeNull();
      expect(typeof data.shareUrl).toBe("string");
    });

    it("should return correct content-type header", async () => {
      const sessionId = "test-session-content-type";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token",
        expiresAt: null
      } as any);

      const request = createMockShareRequest(sessionId);
      const context = createMockShareContext(sessionId);
      const response = await POST(request, context);

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});

// ============================================================================
// GET /api/share/[token] TESTS
// ============================================================================

describe("GET /api/share/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Success Cases", () => {
    it("should successfully fetch session data with valid token", async () => {
      const token = "valid-token-abc123";
      const sessionId = "session-123";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Mining Op Alpha",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 500000,
        distributionMode: "EQUAL",
        taxEnabled: true,
        taxRate: "0.0050",
        members: [
          {
            id: "member-1",
            handle: "Player1",
            role: "Pilot",
            active: true,
            revenue: 0,
            investment: 0,
            percentShare: null,
            fixedBonus: null,
            fixedPayout: null,
            individual: [],
            shared: []
          }
        ],
        sharedExpenses: [],
        individualExpense: []
      };

      const mockPayslip: Payslip = {
        saleRevenue: 450000,
        netProfit: 400000,
        taxRateApplied: 0.005,
        members: [
          {
            memberId: "member-1",
            handle: "Player1",
            role: "Pilot",
            active: true,
            revenue: 0,
            investment: 0,
            individualExpenses: 0,
            sharedExpenses: 0,
            percentShare: null,
            fixedBonus: null,
            fixedPayout: null,
            profitShare: 400000,
            grossPayout: 400000,
            transferTax: 2000,
            netPayout: 398000
          }
        ],
        suggestedTransfers: [],
        summaryStatistics: {
          totalRevenue: 500000,
          totalExpenses: 100000,
          netProfit: 400000,
          totalGrossPayout: 400000,
          totalTransferTax: 2000,
          totalNetPayout: 398000,
          activeMembers: 1,
          inactiveMembers: 0
        }
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue(mockPayslip);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("session");
      expect(data).toHaveProperty("payslip");
      expect(data.session.id).toBe(sessionId);
      expect(data.payslip.saleRevenue).toBe(450000);

      // Verify database calls
      expect(prisma.exportToken.findUnique).toHaveBeenCalledWith({
        where: { token },
        select: {
          id: true,
          sessionId: true,
          expiresAt: true
        }
      });
    });

    it("should call calculatePayslip with correct SessionInput format", async () => {
      const token = "valid-token-calc";
      const sessionId = "session-calc";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test Session",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "PERCENT",
        taxEnabled: true,
        taxRate: "0.0050",
        members: [
          {
            id: "member-1",
            handle: "Player1",
            role: null,
            active: true,
            revenue: 0,
            investment: 0,
            percentShare: "0.5000",
            fixedBonus: null,
            fixedPayout: null,
            individual: [],
            shared: []
          }
        ],
        sharedExpenses: [
          {
            id: "expense-1",
            label: "Fuel",
            amount: 5000,
            members: [
              {
                memberId: "member-1",
                member: { id: "member-1" }
              }
            ]
          }
        ],
        individualExpense: [
          {
            id: "ind-expense-1",
            memberId: "member-1",
            label: "Repairs",
            amount: 1000,
            member: { id: "member-1" }
          }
        ]
      };

      const mockPayslip: Payslip = {
        saleRevenue: 100000,
        netProfit: 94000,
        taxRateApplied: 0.005,
        members: [],
        suggestedTransfers: [],
        summaryStatistics: {
          totalRevenue: 100000,
          totalExpenses: 6000,
          netProfit: 94000,
          totalGrossPayout: 94000,
          totalTransferTax: 470,
          totalNetPayout: 93530,
          activeMembers: 1,
          inactiveMembers: 0
        }
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue(mockPayslip);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      await GET(request, context);

      // Verify calculatePayslip was called with correct SessionInput format
      expect(calculatePayslip).toHaveBeenCalledWith({
        id: sessionId,
        name: "Test Session",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "PERCENT",
        taxEnabled: true,
        taxRate: 0.005,
        members: [
          {
            id: "member-1",
            handle: "Player1",
            role: undefined,
            active: true,
            revenue: 0,
            investment: 0,
            percentShare: 0.5,
            fixedBonus: null,
            fixedPayout: null
          }
        ],
        sharedExpenses: [
          {
            id: "expense-1",
            label: "Fuel",
            amount: 5000,
            participantIds: ["member-1"]
          }
        ],
        individualExpenses: [
          {
            id: "ind-expense-1",
            memberId: "member-1",
            label: "Repairs",
            amount: 1000
          }
        ]
      });
    });

    it("should fetch session with all required relations", async () => {
      const token = "valid-token-relations";
      const sessionId = "session-relations";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: false,
        taxRate: "0.0000",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue({} as any);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      await GET(request, context);

      // Verify session fetch includes all required relations
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
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
    });
  });

  describe("Error Cases", () => {
    it("should return 404 when token does not exist", async () => {
      const token = "non-existent-token";

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(null);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Share token not found",
        token
      });

      // Session query should not be called
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(calculatePayslip).not.toHaveBeenCalled();
    });

    it("should return 404 when token has expired", async () => {
      const token = "expired-token";
      const expiredDate = new Date("2020-01-01T00:00:00.000Z");

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId: "session-123",
        expiresAt: expiredDate
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Share token has expired",
        token
      });

      // Session query should not be called for expired tokens
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(calculatePayslip).not.toHaveBeenCalled();
    });

    it("should return 404 when session does not exist for valid token", async () => {
      const token = "valid-token-no-session";
      const sessionId = "non-existent-session";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Session not found for this token",
        sessionId
      });

      expect(calculatePayslip).not.toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      const token = "db-error-token";

      vi.mocked(prisma.exportToken.findUnique).mockRejectedValue(
        new Error("Database connection error")
      );

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Failed to fetch session data",
        details: "Database connection error"
      });
    });

    it("should return 500 on calculation error", async () => {
      const token = "calc-error-token";
      const sessionId = "session-calc-error";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: false,
        taxRate: "0.0000",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockImplementation(() => {
        throw new Error("Calculation failed");
      });

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Failed to fetch session data",
        details: "Calculation failed"
      });
    });
  });

  describe("Token Expiration Validation", () => {
    it("should allow access with null expiresAt (never expires)", async () => {
      const token = "never-expires-token";
      const sessionId = "session-never-expires";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: false,
        taxRate: "0.0000",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue({} as any);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });

    it("should allow access with future expiration date", async () => {
      const token = "future-expires-token";
      const sessionId = "session-future-expires";
      const futureDate = new Date("2099-12-31T23:59:59.999Z");

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: futureDate
      };

      const mockSession = {
        id: sessionId,
        name: "Test",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: false,
        taxRate: "0.0000",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue({} as any);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe("Response Format", () => {
    it("should return correct response structure", async () => {
      const token = "structure-token";
      const sessionId = "session-structure";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test Session",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: true,
        taxRate: "0.0050",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      const mockPayslip: Payslip = {
        saleRevenue: 100000,
        netProfit: 100000,
        taxRateApplied: 0.005,
        members: [],
        suggestedTransfers: [],
        summaryStatistics: {
          totalRevenue: 100000,
          totalExpenses: 0,
          netProfit: 100000,
          totalGrossPayout: 100000,
          totalTransferTax: 500,
          totalNetPayout: 99500,
          activeMembers: 0,
          inactiveMembers: 0
        }
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue(mockPayslip);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      const data = await response.json();

      // Verify top-level structure
      expect(data).toHaveProperty("session");
      expect(data).toHaveProperty("payslip");

      // Verify session structure
      expect(data.session).toHaveProperty("id");
      expect(data.session).toHaveProperty("name");
      expect(data.session).toHaveProperty("type");
      expect(data.session).toHaveProperty("members");

      // Verify payslip structure
      expect(data.payslip).toHaveProperty("saleRevenue");
      expect(data.payslip).toHaveProperty("netProfit");
      expect(data.payslip).toHaveProperty("members");
      expect(data.payslip).toHaveProperty("summaryStatistics");
    });

    it("should return correct content-type header", async () => {
      const token = "content-type-token";
      const sessionId = "session-content-type";

      const mockExportToken = {
        id: "export-token-uuid",
        sessionId,
        expiresAt: null
      };

      const mockSession = {
        id: sessionId,
        name: "Test",
        type: "MINING",
        currency: "aUEC",
        totalRevenue: 100000,
        distributionMode: "EQUAL",
        taxEnabled: false,
        taxRate: "0.0000",
        members: [],
        sharedExpenses: [],
        individualExpense: []
      };

      vi.mocked(prisma.exportToken.findUnique).mockResolvedValue(mockExportToken as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(calculatePayslip).mockReturnValue({} as any);

      const request = createMockTokenRequest(token);
      const context = createMockTokenContext(token);
      const response = await GET(request, context);

      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});
