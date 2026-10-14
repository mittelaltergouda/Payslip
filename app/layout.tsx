import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieNotice } from "@/components/CookieNotice";
import { Space_Grotesk, Inter, Roboto_Mono } from "next/font/google";
import { headers } from "next/headers";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap"
});

// Terminal font of the hidden Sinister theme (self-hosted by next/font).
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "SC Payslip",
  description: "Teilt Profite, Kosten und Service Fees fair auf  Star Citizen ready."
};

// Request-specific CSP nonces require server rendering for every page request.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // The boot script may set data-theme before hydration.
    <html lang="de" className={`${spaceGrotesk.variable} ${inter.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-body min-h-screen">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
            <SiteFooter />
          </div>
          <CookieNotice />
        </ToastProvider>
      </body>
    </html>
  );
}
