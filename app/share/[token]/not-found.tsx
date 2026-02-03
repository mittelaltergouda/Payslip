import Link from "next/link";

/**
 * NotFound page for invalid or expired share tokens
 *
 * Displays a user-friendly error message when:
 * - Share token doesn't exist in the database
 * - Share token has expired
 * - Session associated with token was deleted
 *
 * Provides a link back to the main page to create a new session.
 */
export default function NotFound() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="glass p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-display text-neon">Share Link Not Found</h1>
          <p className="text-white/70 text-lg">
            This share link is invalid or has expired.
          </p>
        </div>

        <div className="space-y-3 text-white/60">
          <p>Possible reasons:</p>
          <ul className="text-left max-w-md mx-auto space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-neon mt-1">•</span>
              <span>The share token does not exist or is incorrect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon mt-1">•</span>
              <span>The share link has expired (tokens expire after 90 days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon mt-1">•</span>
              <span>The original session was deleted</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-neon/20 hover:bg-neon/30 border border-neon/50 rounded-lg transition-colors text-neon font-semibold"
          >
            ← Back to SC Payslip
          </Link>
        </div>
      </div>
    </main>
  );
}
