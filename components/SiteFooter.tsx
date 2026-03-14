import Link from "next/link";

const footerLinks = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Tool-Tipps", href: "/tool-tipps" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-night/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-white/70">
          © {new Date().getFullYear()} SC Payslip · PIXELFRONTIER. Alle Inhalte können jederzeit angepasst werden.
        </p>
        <div className="flex items-center gap-6 text-xs uppercase tracking-wide">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/80 transition hover:text-neon focus-visible:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neon"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
