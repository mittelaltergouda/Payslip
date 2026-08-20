import type { NextRequest } from "next/server";
import { localOnlyNotFound } from "@/lib/localOnlyApi";

export async function GET() {
  return localOnlyNotFound();
}

export async function POST(_request: NextRequest) {
  return localOnlyNotFound();
}
