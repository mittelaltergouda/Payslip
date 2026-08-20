import type { NextRequest } from "next/server";
import { localOnlyNotFound } from "@/lib/localOnlyApi";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, _context: RouteContext) {
  return localOnlyNotFound();
}

export async function DELETE(_request: NextRequest, _context: RouteContext) {
  return localOnlyNotFound();
}
