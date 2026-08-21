import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieNotice } from "@/components/CookieNotice";
import { rootMetadata, WEB_APPLICATION_STRUCTURED_DATA } from "@/lib/seo";
import { Space_Grotesk, Inter } from "next/font/google";

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

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(WEB_APPLICATION_STRUCTURED_DATA).replace(/</g, "\\u003c"),
          }}
        />
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
