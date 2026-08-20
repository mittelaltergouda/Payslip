import { NextResponse } from "next/server";

/**
 * Public deployments keep session data in the visitor's browser only.
 * Returning a generic 404 prevents accidental re-enablement of legacy
 * server-side persistence without an explicit security review.
 */
export function localOnlyNotFound() {
  return NextResponse.json(
    { error: "Not found" },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
