// ============================================================================
// SESSION DELETE API INTEGRATION TESTS
// ============================================================================
// Integration tests for DELETE /api/sessions/[id] endpoint
// Tests session deletion, CSRF protection, validation, and error handling

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DELETE } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Helper function to create a mock NextRequest with optional CSRF token
function createMockRequest(sessionId: string, csrfToken?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (csrfToken !== undefined) {
    headers["x-csrf-token"] = csrfToken;
  }

  return new NextRequest(`http://localhost:3000/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers
  });
}

// Helper function to create a mock context with params
function createMockContext(sessionId: string) {
  return {
    params: Promise.resolve({ id: sessionId })
  };
}

describe('DELETE /api/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSRF Protection', () => {
    it('returns 403 when CSRF token is missing', async () => {
      const sessionId = 'test-id';
      const request = createMockRequest(sessionId); // No CSRF token
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('CSRF token validation failed');
      expect(data.details).toBe('Invalid or missing CSRF token');

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('returns 403 when CSRF token is empty string', async () => {
      const sessionId = 'test-id';
      const request = createMockRequest(sessionId, ''); // Empty CSRF token
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('CSRF token validation failed');
      expect(data.details).toBe('Invalid or missing CSRF token');

      // Should not attempt database operations
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('accepts request with valid CSRF token', async () => {
      const sessionId = 'test-id';
      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.session.delete).mockResolvedValue({ id: sessionId } as any);

      const csrfToken = 'valid-csrf-token-123';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);

      expect(response.status).toBe(200);
      expect(prisma.session.findUnique).toHaveBeenCalled();
      expect(prisma.session.delete).toHaveBeenCalled();
    });
  });

  describe('Success Cases', () => {
    it('successfully deletes existing session', async () => {
      const sessionId = 'test-id';
      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.session.delete).mockResolvedValue({ id: sessionId } as any);

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(sessionId);
      expect(data.message).toBe('Session deleted successfully');

      // Verify database calls
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        select: { id: true }
      });

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId }
      });
    });

    it('returns correct response structure on successful deletion', async () => {
      const sessionId = 'test-session-123';
      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.session.delete).mockResolvedValue({ id: sessionId } as any);

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        sessionId,
        message: 'Session deleted successfully'
      });
    });
  });

  describe('Error Cases', () => {
    it('returns 404 when session does not exist', async () => {
      const sessionId = 'non-existent-id';
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
      expect(data.sessionId).toBe(sessionId);

      // Should not attempt deletion
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('returns 500 on database error during lookup', async () => {
      const sessionId = 'test-id';
      vi.mocked(prisma.session.findUnique).mockRejectedValue(new Error('Database connection error'));

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete session');
      expect(data.details).toBe('Database connection error');
    });

    it('returns 500 on database error during deletion', async () => {
      const sessionId = 'test-id';
      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.session.delete).mockRejectedValue(new Error('Constraint violation'));

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete session');
      expect(data.details).toBe('Constraint violation');
    });

    it('handles unknown error types gracefully', async () => {
      const sessionId = 'test-id';
      vi.mocked(prisma.session.findUnique).mockRejectedValue('Unknown error string');

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete session');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('Cascade Deletion Behavior', () => {
    it('relies on Prisma cascade to delete related data', async () => {
      const sessionId = 'session-with-data';
      vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: sessionId } as any);
      vi.mocked(prisma.session.delete).mockResolvedValue({ id: sessionId } as any);

      const csrfToken = 'valid-csrf-token';
      const request = createMockRequest(sessionId, csrfToken);
      const context = createMockContext(sessionId);

      await DELETE(request, context);

      // Only session.delete should be called
      // Cascade deletes for members, expenses, and export tokens
      // are handled by Prisma schema configuration
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: sessionId }
      });
    });
  });
});
