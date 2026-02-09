// ============================================================================
// ERROR SANITIZATION INTEGRATION TESTS
// ============================================================================
// Integration tests verifying API error responses don't leak sensitive
// information such as stack traces, file paths, database schema, or library
// versions. Tests all API endpoints that use the sanitizeError() utility.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET as sessionsGet, POST as sessionsPost } from "@/app/api/sessions/route";
import { POST as exportTokenPost } from "@/app/api/sessions/[id]/export-token/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    },
    exportToken: {
      create: vi.fn()
    }
  }
}));

// Mock crypto module to control token generation
vi.mock("@/lib/crypto", () => ({
  generateSecureToken: vi.fn(() => "mock-secure-token-123")
}));

// Helper function to create a mock NextRequest for GET requests
function createMockGetRequest(url: string): NextRequest {
  return new NextRequest(url, {
    method: "GET"
  });
}

// Helper function to create a mock NextRequest for POST requests
function createMockPostRequest(url: string, body: any): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

// Helper function to create a mock context with params
function createMockContext(sessionId: string) {
  return {
    params: Promise.resolve({ id: sessionId })
  };
}

describe("API Error Sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/sessions - Error Sanitization", () => {
    it("should sanitize generic database errors", async () => {
      // Mock database error with sensitive information
      const dbError = new Error("Connection failed at /opt/app/db/connection.ts:42 - PrismaClient v5.18.0");
      dbError.stack = "Error: Connection failed\n    at Database.connect (/opt/app/db/connection.ts:42:15)\n    at Object.<anonymous> (/opt/app/server.ts:10:3)";

      vi.mocked(prisma.session.findMany).mockRejectedValue(dbError);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("details");

      // Verify no sensitive information is leaked
      expect(data.details).not.toContain("/opt/app");
      expect(data.details).not.toContain("connection.ts");
      expect(data.details).not.toContain(":42");
      expect(data.details).not.toContain("PrismaClient");
      expect(data.details).not.toContain("v5.18.0");
      expect(data.details).not.toContain("Database.connect");
      expect(data.details).not.toContain("server.ts");

      // Verify it returns a generic message
      expect(data.details).toBe("An unexpected error occurred");
    });

    it("should sanitize Prisma P2025 errors (record not found)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record to delete does not exist.",
        {
          code: "P2025",
          clientVersion: "5.18.0",
          meta: {
            modelName: "Session",
            cause: "Record not found in table `Session` where `id` = 'test-id'"
          }
        }
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(prismaError);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no database schema leaked
      expect(data.details).not.toContain("Session");
      expect(data.details).not.toContain("table");
      expect(data.details).not.toContain("test-id");
      expect(data.details).not.toContain("5.18.0");
      expect(data.details).not.toContain("modelName");

      // Verify sanitized message
      expect(data.details).toBe("Resource not found");
    });

    it("should sanitize Prisma P2002 errors (unique constraint)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`shareToken`)",
        {
          code: "P2002",
          clientVersion: "5.18.0",
          meta: {
            modelName: "ExportToken",
            target: ["shareToken"]
          }
        }
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(prismaError);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no database schema leaked
      expect(data.details).not.toContain("shareToken");
      expect(data.details).not.toContain("ExportToken");
      expect(data.details).not.toContain("Unique constraint");
      expect(data.details).not.toContain("fields");
      expect(data.details).not.toContain("5.18.0");

      // Verify sanitized message
      expect(data.details).toBe("Resource already exists");
    });

    it("should sanitize Prisma P2003 errors (foreign key constraint)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed on the field: `sessionId`",
        {
          code: "P2003",
          clientVersion: "5.18.0",
          meta: {
            field_name: "sessionId"
          }
        }
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(prismaError);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no database schema leaked
      expect(data.details).not.toContain("sessionId");
      expect(data.details).not.toContain("Foreign key");
      expect(data.details).not.toContain("field_name");
      expect(data.details).not.toContain("5.18.0");

      // Verify sanitized message
      expect(data.details).toBe("Invalid reference to related resource");
    });

    it("should sanitize other Prisma errors (P-prefixed codes)", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "The table `main.Session` does not exist in the current database.",
        {
          code: "P2021",
          clientVersion: "5.18.0",
          meta: {
            table: "main.Session"
          }
        }
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(prismaError);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no database schema leaked
      expect(data.details).not.toContain("main.Session");
      expect(data.details).not.toContain("table");
      expect(data.details).not.toContain("does not exist");
      expect(data.details).not.toContain("5.18.0");

      // Verify generic Prisma error message
      expect(data.details).toBe("Database operation failed");
    });

    it("should not expose stack traces in error responses", async () => {
      const error = new Error("Database connection pool exhausted");
      error.stack = [
        "Error: Database connection pool exhausted",
        "    at Pool.connect (/opt/app/node_modules/prisma/connection.ts:150:10)",
        "    at PrismaClient.connect (/opt/app/node_modules/@prisma/client/runtime/index.js:42:5)",
        "    at GET (/opt/app/app/api/sessions/route.ts:43:20)"
      ].join("\n");

      vi.mocked(prisma.session.findMany).mockRejectedValue(error);

      const _request = createMockGetRequest("http://localhost:3000/api/sessions");
      const response = await sessionsGet();

      const data = await response.json();

      // Verify no stack trace information leaked
      expect(data.details).not.toContain("Pool.connect");
      expect(data.details).not.toContain("node_modules");
      expect(data.details).not.toContain("/opt/app");
      expect(data.details).not.toContain("connection.ts");
      expect(data.details).not.toContain(":150");
      expect(data.details).not.toContain("runtime/index.js");

      // Verify the response body doesn't contain the stack property
      expect(JSON.stringify(data)).not.toContain(error.stack);
    });
  });

  describe("POST /api/sessions - Error Sanitization", () => {
    it("should sanitize database creation errors", async () => {
      const dbError = new Error("Insert failed: invalid column 'invalid_field' at prisma/client.ts:100");
      dbError.stack = "Error: Insert failed\n    at Database.insert (/opt/app/prisma/client.ts:100:5)";

      vi.mocked(prisma.session.create).mockRejectedValue(dbError);

      const request = createMockPostRequest("http://localhost:3000/api/sessions", {
        name: "Test Session",
        type: "MINING",
        taxEnabled: true,
        distribution: "EQUAL",
        members: [
          { handle: "player1", revenue: 1000 }
        ]
      });

      const response = await sessionsPost(request);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no sensitive information leaked
      expect(data.details).not.toContain("invalid_field");
      expect(data.details).not.toContain("prisma/client.ts");
      expect(data.details).not.toContain(":100");
      expect(data.details).not.toContain("Database.insert");
      expect(data.details).not.toContain("/opt/app");

      // Verify generic message
      expect(data.details).toBe("An unexpected error occurred");
    });

    it("should sanitize Zod validation errors", async () => {
      // Simulate a Zod error being thrown (though this would typically happen earlier)
      const zodError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "number",
            path: ["members", 0, "handle"],
            message: "Expected string, received number"
          }
        ],
        message: "Validation failed at members[0].handle: Expected string, received number"
      };

      vi.mocked(prisma.session.create).mockRejectedValue(zodError);

      const request = createMockPostRequest("http://localhost:3000/api/sessions", {
        name: "Test Session",
        type: "MINING",
        taxEnabled: true,
        distribution: "EQUAL",
        members: [
          { handle: 123, revenue: 1000 }
        ]
      });

      const response = await sessionsPost(request);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no validation details leaked
      expect(data.details).not.toContain("invalid_type");
      expect(data.details).not.toContain("members[0].handle");
      expect(data.details).not.toContain("Expected string");
      expect(data.details).not.toContain("received number");

      // Verify sanitized Zod error message
      expect(data.details).toBe("Invalid request data");
    });

    it("should handle null/undefined errors gracefully", async () => {
      vi.mocked(prisma.session.create).mockRejectedValue(null);

      const request = createMockPostRequest("http://localhost:3000/api/sessions", {
        name: "Test Session",
        type: "MINING",
        taxEnabled: true,
        distribution: "EQUAL",
        members: []
      });

      const response = await sessionsPost(request);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify generic message for null errors
      expect(data.details).toBe("An unexpected error occurred");
    });

    it("should sanitize string errors thrown directly", async () => {
      vi.mocked(prisma.session.create).mockRejectedValue(
        "Database error: Connection to postgresql://user:password123@localhost:5432/db failed"
      );

      const request = createMockPostRequest("http://localhost:3000/api/sessions", {
        name: "Test Session",
        type: "MINING",
        taxEnabled: true,
        distribution: "EQUAL",
        members: []
      });

      const response = await sessionsPost(request);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify credentials and connection strings are not leaked
      expect(data.details).not.toContain("password123");
      expect(data.details).not.toContain("postgresql://");
      expect(data.details).not.toContain("localhost:5432");
      expect(data.details).not.toContain("user:");

      // Verify generic message
      expect(data.details).toBe("An unexpected error occurred");
    });
  });

  describe("POST /api/sessions/[id]/export-token - Error Sanitization", () => {
    it("should sanitize database errors in export token creation", async () => {
      const sessionId = "test-session-123";
      const dbError = new Error("Connection timeout at /app/node_modules/pg/lib/connection.ts:512");

      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(dbError);

      const request = createMockPostRequest(
        `http://localhost:3000/api/sessions/${sessionId}/export-token`,
        {}
      );
      const context = createMockContext(sessionId);

      const response = await exportTokenPost(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no sensitive paths leaked
      expect(data.details).not.toContain("/app/node_modules");
      expect(data.details).not.toContain("pg/lib/connection.ts");
      expect(data.details).not.toContain(":512");

      // Verify generic message
      expect(data.details).toBe("An unexpected error occurred");
    });

    it("should sanitize Zod validation errors in export token endpoint", async () => {
      const sessionId = "test-session-456";
      const zodError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            path: ["token"],
            message: "Token must be a string"
          }
        ]
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(zodError);

      const request = createMockPostRequest(
        `http://localhost:3000/api/sessions/${sessionId}/export-token`,
        {}
      );
      const context = createMockContext(sessionId);

      const response = await exportTokenPost(request, context);

      expect(response.status).toBe(500);

      const data = await response.json();

      // Verify no validation schema details leaked
      expect(data.details).not.toContain("invalid_type");
      expect(data.details).not.toContain("Token must be a string");
      expect(data.details).not.toContain("path");

      // Verify sanitized message
      expect(data.details).toBe("Invalid request data");
    });

    it("should handle P2002 errors specially with custom message", async () => {
      const sessionId = "test-session-789";
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the constraint: `ExportToken_token_key`",
        {
          code: "P2002",
          clientVersion: "5.18.0",
          meta: {
            target: ["token"],
            constraint: "ExportToken_token_key"
          }
        }
      );

      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(prismaError);

      const request = createMockPostRequest(
        `http://localhost:3000/api/sessions/${sessionId}/export-token`,
        {}
      );
      const context = createMockContext(sessionId);

      const response = await exportTokenPost(request, context);

      expect(response.status).toBe(409);

      const data = await response.json();

      // Verify custom P2002 handling in export-token endpoint
      expect(data.error).toBe("Token collision detected. Please retry.");

      // Verify no database schema leaked in custom message
      expect(data.details).not.toContain("ExportToken_token_key");
      expect(data.details).not.toContain("constraint");
      expect(data.details).not.toContain("5.18.0");
    });

    it("should not expose library version information", async () => {
      const sessionId = "test-session-version";
      const error = new Error("Failed in @prisma/client@5.18.0 at node_modules/@prisma/client/runtime/library.js:1234");

      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(error);

      const request = createMockPostRequest(
        `http://localhost:3000/api/sessions/${sessionId}/export-token`,
        {}
      );
      const context = createMockContext(sessionId);

      const response = await exportTokenPost(request, context);

      const data = await response.json();

      // Verify no library versions leaked
      expect(data.details).not.toContain("@prisma/client");
      expect(data.details).not.toContain("5.18.0");
      expect(data.details).not.toContain("node_modules");
      expect(data.details).not.toContain("runtime/library.js");
      expect(data.details).not.toContain(":1234");

      // Verify generic message
      expect(data.details).toBe("An unexpected error occurred");
    });

    it("should not expose database connection strings", async () => {
      const sessionId = "test-session-conn";
      const error = new Error("connect ECONNREFUSED postgresql://admin:secretpass@db.example.com:5432/production");

      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.exportToken.create).mockRejectedValue(error);

      const request = createMockPostRequest(
        `http://localhost:3000/api/sessions/${sessionId}/export-token`,
        {}
      );
      const context = createMockContext(sessionId);

      const response = await exportTokenPost(request, context);

      const data = await response.json();

      // Verify no connection details leaked
      expect(data.details).not.toContain("postgresql://");
      expect(data.details).not.toContain("admin");
      expect(data.details).not.toContain("secretpass");
      expect(data.details).not.toContain("db.example.com");
      expect(data.details).not.toContain("5432");
      expect(data.details).not.toContain("production");
      expect(data.details).not.toContain("ECONNREFUSED");

      // Verify generic message
      expect(data.details).toBe("An unexpected error occurred");
    });
  });

  describe("Security Properties - Cross-Endpoint", () => {
    it("should never expose error.stack property in any response", async () => {
      const errorWithStack = new Error("Test error");
      errorWithStack.stack = "Error: Test error\n    at somefile.ts:123:45\n    at anotherfile.ts:678:90";

      // Test GET /api/sessions
      vi.mocked(prisma.session.findMany).mockRejectedValue(errorWithStack);
      const getResponse = await sessionsGet();
      const getData = await getResponse.json();
      expect(JSON.stringify(getData)).not.toContain(errorWithStack.stack!);
      expect(getData).not.toHaveProperty("stack");

      // Test POST /api/sessions
      vi.mocked(prisma.session.create).mockRejectedValue(errorWithStack);
      const postRequest = createMockPostRequest("http://localhost:3000/api/sessions", {
        name: "Test",
        type: "MINING",
        distribution: "EQUAL",
        members: []
      });
      const postResponse = await sessionsPost(postRequest);
      const postData = await postResponse.json();
      expect(JSON.stringify(postData)).not.toContain(errorWithStack.stack!);
      expect(postData).not.toHaveProperty("stack");
    });

    it("should never expose file paths in any response", async () => {
      const errorWithPath = new Error("Failed at C:\\Users\\admin\\project\\src\\db\\index.ts line 42");

      vi.mocked(prisma.session.findMany).mockRejectedValue(errorWithPath);
      const response = await sessionsGet();
      const data = await response.json();

      // Verify no Windows or Unix paths leaked
      expect(data.details).not.toContain("C:\\");
      expect(data.details).not.toContain("/Users/");
      expect(data.details).not.toContain("\\src\\");
      expect(data.details).not.toContain("/db/");
      expect(data.details).not.toContain("index.ts");
      expect(data.details).not.toContain("line 42");
    });

    it("should never expose database table names or column names", async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Invalid column Session.invalidColumn in table public.Session",
        {
          code: "P2021",
          clientVersion: "5.18.0",
          meta: {
            table: "public.Session",
            column: "invalidColumn"
          }
        }
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(prismaError);
      const response = await sessionsGet();
      const data = await response.json();

      // Verify no schema details leaked
      expect(data.details).not.toContain("Session");
      expect(data.details).not.toContain("invalidColumn");
      expect(data.details).not.toContain("public.");
      expect(data.details).not.toContain("table");
      expect(data.details).not.toContain("column");

      // Should return generic database error
      expect(data.details).toBe("Database operation failed");
    });

    it("should never expose environment variables or credentials", async () => {
      const errorWithCredentials = new Error(
        "Connection failed: DATABASE_URL=postgresql://user:pass123@localhost:5432/mydb API_KEY=sk-1234567890"
      );

      vi.mocked(prisma.session.findMany).mockRejectedValue(errorWithCredentials);
      const response = await sessionsGet();
      const data = await response.json();

      // Verify no credentials leaked
      expect(data.details).not.toContain("DATABASE_URL");
      expect(data.details).not.toContain("API_KEY");
      expect(data.details).not.toContain("pass123");
      expect(data.details).not.toContain("sk-1234567890");
      expect(data.details).not.toContain("postgresql://");

      // Should return generic message
      expect(data.details).toBe("An unexpected error occurred");
    });
  });
});
