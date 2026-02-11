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

// Helper function to create a mock NextRequest with optional CSRF token and cookie
function createMockRequest(sessionId: string, csrfToken?: string, csrfCookie?: string): any {
  const headers: Record<string, string> = {};
  if (csrfToken !== undefined) {
    headers["x-csrf-token"] = csrfToken;
  }

  const request = new NextRequest(`http://localhost:3000/api/sessions/${sessionId}/export-token`, {
    method: "POST",
    headers
  });

  // Mock cookies API
  const originalCookiesGet = request.cookies.get.bind(request.cookies);
  request.cookies.get = (name: string) => {
    if (name === 'csrf-token') {
      return csrfCookie !== undefined ? { name: 'csrf-token', value: csrfCookie } : undefined;
    }
    return originalCookiesGet(name);
  };

  return request;
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
      const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const mockExportToken = {
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: mockExpiresAt
      };

      // Mock session exists
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      // Mock token creation
      vi.mocked(prisma.exportToken.create).mockResolvedValue(mockExportToken as any);

      const csrfToken = "valid-csrf-token-123";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toMatchObject({
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        shareUrl: `/session/${mockToken}`
      });
      expect(data.expiresAt).toBeTruthy();
      expect(new Date(data.expiresAt)).toBeInstanceOf(Date);

      // Verify database calls
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        select: { id: true }
      });

      expect(prisma.exportToken.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          token: expect.any(String),
          expiresAt: expect.any(Date)
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any);
      }) as any);

      const csrfToken = "valid-csrf-token-456";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any);
      }) as any);

      const csrfToken = "valid-csrf-token-789";
      // Generate 3 tokens for the same session
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-store";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      await POST(request, context);

      // Verify database create was called with correct structure
      expect(prisma.exportToken.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          token: expect.any(String),
          expiresAt: expect.any(Date) // 7 days expiration by default
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-url";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();
      expect(data.shareUrl).toBe(`/session/${mockToken}`);
    });
  });

  describe("CSRF Protection - Double-Submit Cookie Pattern", () => {
    it("should return 403 when CSRF token missing from header", async () => {
      const sessionId = "test-session-no-header";

      // Cookie present but header missing (attacker cannot read cookie)
      const request = createMockRequest(sessionId, undefined, "valid-cookie-token");
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "CSRF token validation failed",
        details: "Invalid or missing CSRF token"
      });

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should return 403 when CSRF token missing from cookie", async () => {
      const sessionId = "test-session-no-cookie";

      // Header present but cookie missing (middleware didn't set cookie)
      const request = createMockRequest(sessionId, "attacker-token", undefined);
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "CSRF token validation failed",
        details: "Invalid or missing CSRF token"
      });

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should return 403 when CSRF tokens do not match", async () => {
      const sessionId = "test-session-mismatch";

      // Header and cookie both present but don't match
      const request = createMockRequest(sessionId, "token-from-attacker", "token-from-server");
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "CSRF token validation failed",
        details: "Invalid or missing CSRF token"
      });

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should return 403 when both tokens are empty strings", async () => {
      const sessionId = "test-session-empty-csrf";

      // Both empty (invalid)
      const request = createMockRequest(sessionId, "", "");
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "CSRF token validation failed",
        details: "Invalid or missing CSRF token"
      });

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should prevent cross-site attack (attacker cannot read cookie)", async () => {
      const sessionId = "test-session-csrf-attack";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      // Simulate attacker at evil.com trying to attack victim-app.com
      // Attacker can send header but cannot read HTTP-only cookie
      const maliciousRequest = createMockRequest(sessionId, "attacker-guessed-token", undefined);
      const context = createMockContext(sessionId);
      const response = await POST(maliciousRequest, context);

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("CSRF token validation failed");

      // Database operations should not be executed (attack prevented)
      expect(prisma.exportToken.create).not.toHaveBeenCalled();
    });

    it("should allow legitimate request with matching tokens", async () => {
      const sessionId = "test-session-valid-csrf";
      const mockSession = { id: sessionId };
      const mockToken = "secure-export-token";

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: mockToken,
        expiresAt: null
      } as any);

      // Legitimate request: client read token from response header and included it
      // Server set matching token in cookie
      const csrfToken = "valid-csrf-token";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Tokens match
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(201);

      // Database operations should be executed
      expect(prisma.session.findUnique).toHaveBeenCalled();
      expect(prisma.exportToken.create).toHaveBeenCalled();
    });
  });

  describe("Error Cases", () => {
    it("should return 404 when session does not exist", async () => {
      const sessionId = "non-existent-session";

      // Mock session not found
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const csrfToken = "valid-csrf-token-404";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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

      const csrfToken = "valid-csrf-token-409";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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

      const csrfToken = "valid-csrf-token-500";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        error: "Failed to generate export token",
        details: "Database connection error"
      });
    });

    it("should return 500 on unexpected error", async () => {
      const sessionId = "test-session-unexpected";
      const mockSession = { id: sessionId };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue("Unexpected error");

      const csrfToken = "valid-csrf-token-unexpected";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any);
      }) as any);

      const csrfToken = "valid-csrf-token-entropy";
      // Generate 100 tokens
      for (let i = 0; i < 100; i++) {
        const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        } as any);
      }) as any);

      const csrfToken = "valid-csrf-token-url-safe";
      // Generate 50 tokens to test URL safety
      for (let i = 0; i < 50; i++) {
        const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-validation";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
      const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid-123",
        sessionId,
        token: mockToken,
        expiresAt: mockExpiresAt
      } as any);

      const csrfToken = "valid-csrf-token-structure";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
      expect(data.expiresAt).toBeTruthy();
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-content-type";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should set expiration to 7 days from now", async () => {
      const sessionId = "test-session-expires";
      const mockSession = { id: sessionId };
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.exportToken.create).mockResolvedValue({
        id: "token-uuid",
        sessionId,
        token: "test-token",
        expiresAt: new Date(now + sevenDaysInMs)
      } as any);

      const csrfToken = "valid-csrf-token-expires-null";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
      const context = createMockContext(sessionId);
      const response = await POST(request, context);

      const data = await response.json();

      // expiresAt should be set to 7 days from now
      expect(data.expiresAt).toBeTruthy();
      const expiresAt = new Date(data.expiresAt);
      expect(expiresAt).toBeInstanceOf(Date);

      // Verify it's approximately 7 days from now (allow 1 second variance)
      const expectedExpiration = now + sevenDaysInMs;
      const actualExpiration = expiresAt.getTime();
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-verify";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any);

      const csrfToken = "valid-csrf-token-select";
      const request = createMockRequest(sessionId, csrfToken, csrfToken); // Cookie must match header
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
