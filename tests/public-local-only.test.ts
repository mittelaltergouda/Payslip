import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    exportToken: {
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/sessions/route";
import { DELETE } from "@/app/api/sessions/[id]/route";
import { POST as createExportToken } from "@/app/api/sessions/[id]/export-token/route";

const sessionId = "8f5da5ea-88bf-4acd-b2e4-fcb98b291681";

describe("public local-only deployment", () => {
  it("does not expose a server-side session list", async () => {
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("does not accept server-side session writes", async () => {
    const request = new NextRequest("https://payslip.cheesy.cloud/api/sessions", {
      method: "POST",
      body: JSON.stringify({ name: "private crew data" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it("does not expose server-side deletion", async () => {
    const request = new NextRequest(`https://payslip.cheesy.cloud/api/sessions/${sessionId}`, {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: sessionId }) });

    expect(response.status).toBe(404);
  });

  it("does not create server-side share tokens", async () => {
    const request = new NextRequest(
      `https://payslip.cheesy.cloud/api/sessions/${sessionId}/export-token`,
      { method: "POST" },
    );

    const response = await createExportToken(request, {
      params: Promise.resolve({ id: sessionId }),
    });

    expect(response.status).toBe(404);
  });
});