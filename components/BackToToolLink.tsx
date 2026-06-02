import Link from "next/link";

export function BackToToolLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-full border border-neon px-6 py-2 text-sm font-semibold text-white transition hover:bg-neon/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
    >
      Zurück zum Tool
    </Link>
  );
}
