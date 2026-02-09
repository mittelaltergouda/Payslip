// ============================================================================
// EXPORT TOKEN API INTEGRATION TESTS
// ============================================================================
// Integration tests for POST /api/sessions/[id]/export-token endpoint
// Tests token generation, validation, error handling, and database storage

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/sessions/[id]/export-token/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn()
    },
    exportToken: {
      create: vi.fn()
    }
  }
}));

// Helper function to create a mock NextRequest
function createMockRequest(sessionId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/sessions/${sessionId}/export-token`, {
    method: "POST"
  });
}

// Helper function to create a mock context with params
function createMockContext(sessionId: string) {
  return {
    params: Promise.resolve({ id: sessionId })
  };
}

describe("POST /api/sessions/[id]/export-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Success Cases", () => {
    it("should successfully create export token for valid session", async () => {
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: null,
        shareUrl: `/session/${mockToken}`
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
      vi.mocked(prisma.exportToken.create).mockImplementation(((args: any) => {
        capturedToken = args.data.token;
        return Promise.resolve({
          id: "token-uuid",
          sessionId,
          token: capturedToken,
          expiresAt: null
        } as any);
      }) as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
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
      vi.mocked(prisma.exportToken.create).mockImplementation(((args: any) => {
        const token = args.data.token;
        generatedTokens.push(token);
        return Promise.resolve({
          id: `token-uuid-${generatedTokens.length}`,
          sessionId,
          token,
          expiresAt: null
        } as any);
      }) as any);

      // Generate 3 tokens for the same session
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(sessionId);
        const context = createMockContext(sessionId);
        await POST(request, context);
      }

      // All tokens should be unique
      expect(generatedTokens.length).toBe(3);
      expect(new Set(generatedTokens).size).toBe(3);
    });

    it("should store token correctly in database", async () => {
      const sessionId = "test-session-store";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token-123",
        expiresAt: null
      } as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      await POST(request, context);

      // Verify database create was called with correct structure
      expect(prisma.exportToken.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          token: expect.any(String),
          expiresAt: null // No expiration by default
        }
      });
    });

    it("should include shareUrl in response", async () => {
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();
      expect(data.shareUrl).toBe(`/session/${mockToken}`);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 when session does not exist", async () => {
      const sessionId = "non-existent-session";

      // Mock session not found
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Failed to generate export token",
        details: "An unexpected error occurred" // Sanitized error message
      });
    });

    it("should return 500 on unexpected error", async () => {
      const sessionId = "test-session-unexpected";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue("Unexpected error");

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe("Failed to generate export token");
    });
  });

  describe("Token Security Properties", () => {
    it("should generate tokens with sufficient entropy", async () => {
      const sessionId = "test-session-entropy";
      const mockSession = { id: sessionId };
      const generatedTokens: string[] = [];

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockImplementation(((args: any) => {
        const token = args.data.token;
        generatedTokens.push(token);
        return Promise.resolve({
          id: `token-${generatedTokens.length}`,
          sessionId,
          token,
          expiresAt: null
        } as any);
      }) as any);

      // Generate 100 tokens
      for (let i = 0; i < 100; i++) {
        const request = createMockRequest(sessionId);
        const context = createMockContext(sessionId);
        await POST(request, context);
      }

      // All 100 tokens should be unique (no collisions)
      expect(new Set(generatedTokens).size).toBe(100);

      // Each token should be 43 characters
      generatedTokens.forEach(token => {
        expect(token).toHaveLength(43);
      });
    });

    it("should generate tokens with URL-safe characters only", async () => {
      const sessionId = "test-session-url-safe";
      const mockSession = { id: sessionId };
      const generatedTokens: string[] = [];

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockImplementation(((args: any) => {
        const token = args.data.token;
        generatedTokens.push(token);
        return Promise.resolve({
          id: `token-${generatedTokens.length}`,
          sessionId,
          token,
          expiresAt: null
        } as any);
      }) as any);

      // Generate 50 tokens to test URL safety
      for (let i = 0; i < 50; i++) {
        const request = createMockRequest(sessionId);
        const context = createMockContext(sessionId);
        await POST(request, context);
      }

      // All tokens should contain only URL-safe characters
      generatedTokens.forEach(token => {
        // Should NOT contain + / = (standard base64 characters)
        expect(token).not.toMatch(/[+/=]/);

        // Should ONLY contain A-Z, a-z, 0-9, -, _
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });

    it("should generate tokens that pass validation schema", async () => {
      const sessionId = "test-session-validation";
      const mockSession = { id: sessionId };
      const mockToken = "valid-URL-safe_token123-xyz_789";

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: mockToken,
        expiresAt: null
      } as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(201);

      const data = await response.json();

      // Token should pass the validation schema requirements
      expect(data.token).toBeTruthy();
      expect(data.token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(data.token.length).toBeGreaterThan(0);
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
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

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should handle expiresAt null correctly", async () => {
      const sessionId = "test-session-expires-null";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token",
        expiresAt: null
      } as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();

      // expiresAt should be null (no expiration)
      expect(data.expiresAt).toBeNull();
    });
  });

  describe("Database Interaction", () => {
    it("should verify session exists before generating token", async () => {
      const sessionId = "test-session-verify";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token",
        expiresAt: null
      } as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      await POST(request, context);

      // Verify session check happens before token creation
      expect(prisma.session.findUnique).toHaveBeenCalledBefore(prisma.exportToken.create as any);
    });

    it("should select only session id for efficiency", async () => {
      const sessionId = "test-session-select";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token",
        expiresAt: null
      } as any);

      const request = createMockRequest(sessionId);
      const context = createMockContext(sessionId);
      await POST(request, context);

      // Verify we only select the id field (efficient query)
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        select: { id: true }
      });
    });
  });
});
