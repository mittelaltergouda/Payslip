import { sanitizeError } from './errors';

// Test cases for sanitizeError() - Secure error message sanitization for API responses

describe('sanitizeError', () => {
  describe('null and undefined handling', () => {
    it('should return generic message for null', () => {
      const result = sanitizeError(null);
      expect(result).toBe("An unexpected error occurred");
    });

    it('should return generic message for undefined', () => {
      const result = sanitizeError(undefined);
      expect(result).toBe("An unexpected error occurred");
    });

    it('should not leak null/undefined type information', () => {
      const nullResult = sanitizeError(null);
      const undefinedResult = sanitizeError(undefined);

      // Both should return the same generic message
      expect(nullResult).toBe(undefinedResult);

      // Should not contain "null" or "undefined" strings
      expect(nullResult).not.toContain("null");
      expect(nullResult).not.toContain("undefined");
    });
  });

  describe('Prisma error handling - unique constraint (P2002)', () => {
    it('should return specific message for P2002 unique constraint violation', () => {
      const prismaError = {
        code: "P2002",
        message: "Unique constraint failed on the fields: (`shareToken`)",
        meta: { target: ["shareToken"] }
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Resource already exists");
    });

    it('should not leak database field names from P2002 errors', () => {
      const prismaError = {
        code: "P2002",
        message: "Unique constraint failed on the fields: (`shareToken`)",
        meta: { target: ["shareToken"] }
      };

      const result = sanitizeError(prismaError);

      // Should not expose field names
      expect(result).not.toContain("shareToken");
      expect(result).not.toContain("fields");
      expect(result).not.toContain("constraint");
    });

    it('should not leak table names from P2002 errors', () => {
      const prismaError = {
        code: "P2002",
        message: "Unique constraint failed on the constraint: `Session_shareToken_key`",
        meta: { target: ["Session", "shareToken"] }
      };

      const result = sanitizeError(prismaError);

      // Should not expose table names
      expect(result).not.toContain("Session");
      expect(result).not.toContain("shareToken");
    });
  });

  describe('Prisma error handling - record not found (P2025)', () => {
    it('should return specific message for P2025 record not found', () => {
      const prismaError = {
        code: "P2025",
        message: "An operation failed because it depends on one or more records that were required but not found. Record to update not found.",
        meta: {}
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Resource not found");
    });

    it('should not leak database operation details from P2025 errors', () => {
      const prismaError = {
        code: "P2025",
        message: "Record to update not found. Operation: updateOne, Model: Session, Where: { id: '123' }",
        meta: { cause: "Record to update not found." }
      };

      const result = sanitizeError(prismaError);

      // Should not expose operation details
      expect(result).not.toContain("updateOne");
      expect(result).not.toContain("Session");
      expect(result).not.toContain("id");
      expect(result).not.toContain("123");
    });
  });

  describe('Prisma error handling - foreign key constraint (P2003)', () => {
    it('should return specific message for P2003 foreign key violation', () => {
      const prismaError = {
        code: "P2003",
        message: "Foreign key constraint failed on the field: `sessionId`",
        meta: { field_name: "sessionId" }
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Invalid reference to related resource");
    });

    it('should not leak foreign key field names from P2003 errors', () => {
      const prismaError = {
        code: "P2003",
        message: "Foreign key constraint failed on the field: `sessionId`",
        meta: { field_name: "sessionId" }
      };

      const result = sanitizeError(prismaError);

      // Should not expose field names
      expect(result).not.toContain("sessionId");
      expect(result).not.toContain("field");
      expect(result).not.toContain("constraint");
    });
  });

  describe('Prisma error handling - other error codes', () => {
    it('should return generic database error for P2001 (record not found in where)', () => {
      const prismaError = {
        code: "P2001",
        message: "The record searched for in the where condition does not exist"
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Database operation failed");
    });

    it('should return generic database error for P2004 (constraint failed)', () => {
      const prismaError = {
        code: "P2004",
        message: "A constraint failed on the database"
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Database operation failed");
    });

    it('should return generic database error for P2015 (related record not found)', () => {
      const prismaError = {
        code: "P2015",
        message: "A related record could not be found"
      };

      const result = sanitizeError(prismaError);
      expect(result).toBe("Database operation failed");
    });

    it('should handle all P-prefixed error codes generically', () => {
      const errorCodes = ["P1000", "P1001", "P2000", "P2010", "P2020", "P2099"];

      errorCodes.forEach(code => {
        const prismaError = { code, message: "Some database error" };
        const result = sanitizeError(prismaError);

        expect(result).toBe("Database operation failed");
        expect(result).not.toContain(code);
      });
    });

    it('should not leak Prisma-specific terminology', () => {
      const prismaError = {
        code: "P2010",
        message: "Raw query failed. Code: `42P01`. Message: `db error: ERROR: relation \"Session\" does not exist`"
      };

      const result = sanitizeError(prismaError);

      // Should not expose database errors or SQL details
      expect(result).not.toContain("Raw query");
      expect(result).not.toContain("42P01");
      expect(result).not.toContain("relation");
      expect(result).not.toContain("Session");
      expect(result).not.toContain("SQL");
    });
  });

  describe('Zod validation error handling', () => {
    it('should return validation message for ZodError', () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["members", 0, "name"],
            message: "Required"
          }
        ]
      };

      const result = sanitizeError(zodError);
      expect(result).toBe("Invalid request data");
    });

    it('should not leak validation field paths from ZodError', () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "undefined",
            path: ["members", 0, "name"],
            message: "Required"
          }
        ]
      };

      const result = sanitizeError(zodError);

      // Should not expose field paths
      expect(result).not.toContain("members");
      expect(result).not.toContain("name");
      expect(result).not.toContain("path");
    });

    it('should not leak validation type information from ZodError', () => {
      const zodError = {
        name: "ZodError",
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            received: "number",
            path: ["distributionMode"],
            message: "Expected string, received number"
          }
        ]
      };

      const result = sanitizeError(zodError);

      // Should not expose type details
      expect(result).not.toContain("string");
      expect(result).not.toContain("number");
      expect(result).not.toContain("invalid_type");
      expect(result).not.toContain("distributionMode");
    });

    it('should handle ZodError with multiple validation issues', () => {
      const zodError = {
        name: "ZodError",
        issues: [
          { code: "too_small", path: ["revenue"], message: "Must be at least 0" },
          { code: "invalid_type", path: ["expenses"], message: "Required" },
          { code: "too_big", path: ["members"], message: "Array too large" }
        ]
      };

      const result = sanitizeError(zodError);

      // Should return generic message regardless of issue count
      expect(result).toBe("Invalid request data");

      // Should not leak any validation details
      expect(result).not.toContain("revenue");
      expect(result).not.toContain("expenses");
      expect(result).not.toContain("members");
      expect(result).not.toContain("too_small");
    });
  });

  describe('standard Error object handling', () => {
    it('should return generic message for standard Error', () => {
      const error = new Error("Database connection failed: ECONNREFUSED");
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
    });

    it('should not leak error message content', () => {
      const error = new Error("Database connection failed at localhost:5432");
      const result = sanitizeError(error);

      // Should not expose original error message
      expect(result).not.toContain("Database");
      expect(result).not.toContain("localhost");
      expect(result).not.toContain("5432");
      expect(result).not.toContain("connection");
    });

    it('should not leak stack traces from Error objects', () => {
      const error = new Error("Test error");
      // error.stack typically contains file paths and line numbers
      const result = sanitizeError(error);

      // Should not contain stack trace elements
      expect(result).not.toContain("at ");
      expect(result).not.toContain(".ts:");
      expect(result).not.toContain(".js:");
      expect(result).not.toContain("Error:");
      expect(result).not.toContain("\n");
    });

    it('should not leak file paths from Error objects', () => {
      const error = new Error("Error in /app/api/sessions/route.ts at line 79");
      const result = sanitizeError(error);

      // Should not expose file paths
      expect(result).not.toContain("/app");
      expect(result).not.toContain("route.ts");
      expect(result).not.toContain("line 79");
    });

    it('should handle TypeError consistently', () => {
      const error = new TypeError("Cannot read property 'id' of undefined");
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
      expect(result).not.toContain("TypeError");
      expect(result).not.toContain("property");
      expect(result).not.toContain("undefined");
    });

    it('should handle ReferenceError consistently', () => {
      const error = new ReferenceError("session is not defined");
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
      expect(result).not.toContain("ReferenceError");
      expect(result).not.toContain("session");
    });

    it('should handle RangeError consistently', () => {
      const error = new RangeError("Invalid array length");
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
      expect(result).not.toContain("RangeError");
      expect(result).not.toContain("array");
    });
  });

  describe('primitive type handling', () => {
    it('should return generic message for string errors', () => {
      const result = sanitizeError("Database connection failed");
      expect(result).toBe("An unexpected error occurred");
    });

    it('should not leak string error content', () => {
      const sensitiveMessage = "API key invalid: sk_live_123abc at auth.ts:42";
      const result = sanitizeError(sensitiveMessage);

      // Should not expose the original string
      expect(result).not.toContain("API key");
      expect(result).not.toContain("sk_live");
      expect(result).not.toContain("auth.ts");
    });

    it('should return generic message for number errors', () => {
      const result = sanitizeError(404);
      expect(result).toBe("An unexpected error occurred");
    });

    it('should return generic message for boolean errors', () => {
      const result = sanitizeError(false);
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle empty string consistently', () => {
      const result = sanitizeError("");
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle zero consistently', () => {
      const result = sanitizeError(0);
      expect(result).toBe("An unexpected error occurred");
    });
  });

  describe('unknown object type handling', () => {
    it('should return generic message for plain objects without error properties', () => {
      const unknownError = { foo: "bar", status: 500 };
      const result = sanitizeError(unknownError);

      expect(result).toBe("An unexpected error occurred");
    });

    it('should not leak object properties', () => {
      const unknownError = {
        database: "postgresql://user:pass@localhost:5432/db",
        query: "SELECT * FROM users WHERE id = 1",
        timestamp: "2024-01-01T00:00:00Z"
      };

      const result = sanitizeError(unknownError);

      // Should not expose any object properties
      expect(result).not.toContain("postgresql");
      expect(result).not.toContain("SELECT");
      expect(result).not.toContain("users");
      expect(result).not.toContain("timestamp");
    });

    it('should handle objects with code property but not Prisma errors', () => {
      const customError = { code: "CUSTOM_ERROR", message: "Something went wrong" };
      const result = sanitizeError(customError);

      // Should not match Prisma error handling (doesn't start with "P")
      expect(result).toBe("An unexpected error occurred");
      expect(result).not.toContain("CUSTOM_ERROR");
    });

    it('should handle objects with name property but not ZodError', () => {
      const customError = { name: "CustomError", details: "Sensitive information" };
      const result = sanitizeError(customError);

      // Should not match ZodError handling
      expect(result).toBe("An unexpected error occurred");
      expect(result).not.toContain("CustomError");
      expect(result).not.toContain("Sensitive");
    });

    it('should handle empty objects', () => {
      const result = sanitizeError({});
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle arrays', () => {
      const result = sanitizeError(["error1", "error2"]);
      expect(result).toBe("An unexpected error occurred");
    });
  });

  describe('security properties', () => {
    it('should never include stack trace information', () => {
      const errors = [
        new Error("Test error with stack"),
        { code: "P2002", message: "Stack: at someFunction (file.ts:42)" },
        "Error at line 123 in module.ts"
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should not contain stack trace patterns
        expect(result).not.toMatch(/at \w+/);
        expect(result).not.toMatch(/\w+\.ts:\d+/);
        expect(result).not.toMatch(/\w+\.js:\d+/);
        expect(result).not.toMatch(/line \d+/);
      });
    });

    it('should never include file paths', () => {
      const errors = [
        new Error("/app/api/sessions/route.ts error"),
        { code: "P2010", message: "Error in C:\\Users\\app\\src\\db.ts" },
        "Error at ./lib/prisma.ts"
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should not contain file path patterns
        expect(result).not.toMatch(/\/[\w\/]+\.ts/);
        expect(result).not.toMatch(/[A-Z]:\\[\w\\]+/);
        expect(result).not.toMatch(/\.\/[\w\/]+/);
        expect(result).not.toContain(".ts");
        expect(result).not.toContain(".js");
      });
    });

    it('should never include database schema information', () => {
      const errors = [
        { code: "P2002", message: "Unique constraint on Session.shareToken" },
        { code: "P2025", message: "Record in table 'PayoutMember' not found" },
        new Error("Foreign key to 'sessions' table failed")
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should not contain database schema terms
        expect(result).not.toContain("Session");
        expect(result).not.toContain("PayoutMember");
        expect(result).not.toContain("sessions");
        expect(result).not.toContain("table");
        expect(result).not.toContain("shareToken");
      });
    });

    it('should never include library version information', () => {
      const errors = [
        new Error("Prisma v5.18.0 error"),
        { message: "Zod@3.23.8 validation failed" },
        "Next.js 14.2.0 internal error"
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should not contain version information
        expect(result).not.toMatch(/v?\d+\.\d+\.\d+/);
        expect(result).not.toContain("Prisma");
        expect(result).not.toContain("Zod");
        expect(result).not.toContain("Next.js");
      });
    });

    it('should never include environment variables or credentials', () => {
      const errors = [
        new Error("DATABASE_URL=postgresql://user:pass@host/db failed"),
        { message: "API_KEY=sk_live_123abc is invalid" },
        "JWT_SECRET leaked"
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should not contain credentials or env vars
        expect(result).not.toContain("DATABASE_URL");
        expect(result).not.toContain("postgresql://");
        expect(result).not.toContain("API_KEY");
        expect(result).not.toContain("sk_live");
        expect(result).not.toContain("JWT_SECRET");
        expect(result).not.toContain("pass@");
      });
    });

    it('should return only safe, generic messages', () => {
      const safeMessages = [
        "An unexpected error occurred",
        "Resource already exists",
        "Resource not found",
        "Invalid reference to related resource",
        "Database operation failed",
        "Invalid request data"
      ];

      // Test various error types
      const errors = [
        new Error("Sensitive info"),
        null,
        undefined,
        { code: "P2002" },
        { code: "P2025" },
        { code: "P2003" },
        { code: "P2010" },
        { name: "ZodError" },
        "string error",
        123,
        { unknown: "object" }
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Result should be one of the safe messages
        expect(safeMessages).toContain(result);
      });
    });

    it('should produce consistent output for same error type', () => {
      // Same error types should always return the same sanitized message
      const error1 = new Error("Different message 1");
      const error2 = new Error("Different message 2");

      expect(sanitizeError(error1)).toBe(sanitizeError(error2));

      const prisma1 = { code: "P2002", message: "Unique constraint A" };
      const prisma2 = { code: "P2002", message: "Unique constraint B" };

      expect(sanitizeError(prisma1)).toBe(sanitizeError(prisma2));

      const zod1 = { name: "ZodError", issues: [{ path: ["a"] }] };
      const zod2 = { name: "ZodError", issues: [{ path: ["b"] }] };

      expect(sanitizeError(zod1)).toBe(sanitizeError(zod2));
    });

    it('should never return empty or undefined responses', () => {
      const errors = [
        null,
        undefined,
        "",
        {},
        [],
        new Error(""),
        { code: "P9999" },
        "any string",
        42
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Result should always be a non-empty string
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle circular reference objects', () => {
      const circularError: any = { message: "Circular" };
      circularError.self = circularError;

      const result = sanitizeError(circularError);
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle errors with undefined code property', () => {
      const error = { code: undefined, message: "Test" };
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle errors with null code property', () => {
      const error = { code: null, message: "Test" };
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle errors with numeric code property', () => {
      const error = { code: 500, message: "Server error" };
      const result = sanitizeError(error);

      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle very long error messages efficiently', () => {
      const longMessage = "Error: ".repeat(10000) + "Sensitive data";
      const error = new Error(longMessage);

      const result = sanitizeError(error);

      // Should still return short generic message
      expect(result).toBe("An unexpected error occurred");
      expect(result.length).toBeLessThan(100);
    });

    it('should handle errors with special characters', () => {
      const errors = [
        new Error("Error with \n newlines \t tabs"),
        { code: "P2002", message: "Error with <script>alert('xss')</script>" },
        "Error with \u0000 null bytes \uFFFD"
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);

        // Should return safe messages without special chars
        expect(result).not.toContain("\n");
        expect(result).not.toContain("\t");
        expect(result).not.toContain("<script>");
        expect(result).not.toContain("\u0000");
      });
    });

    it('should handle Symbol errors', () => {
      const result = sanitizeError(Symbol("error"));
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle BigInt errors', () => {
      const result = sanitizeError(BigInt(12345));
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle Function errors', () => {
      const result = sanitizeError(() => { throw new Error("test"); });
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle Date objects', () => {
      const result = sanitizeError(new Date());
      expect(result).toBe("An unexpected error occurred");
    });

    it('should handle RegExp objects', () => {
      const result = sanitizeError(/error/g);
      expect(result).toBe("An unexpected error occurred");
    });
  });
});
