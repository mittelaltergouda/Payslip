import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}));

describe('DELETE /api/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when session does not exist', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/sessions/test-id', {
      method: 'DELETE'
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
  });

  it('successfully deletes existing session', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 'test-id' } as any);
    vi.mocked(prisma.session.delete).mockResolvedValue({ id: 'test-id' } as any);

    const request = new Request('http://localhost/api/sessions/test-id', {
      method: 'DELETE'
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBe('test-id');
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: 'test-id' }
    });
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.session.findUnique).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost/api/sessions/test-id', {
      method: 'DELETE'
    });
    const context = { params: Promise.resolve({ id: 'test-id' }) };

    const response = await DELETE(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete session');
  });
});
