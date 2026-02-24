import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import { LayoutClient } from "@/app/layout-client";
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

export const metadata: Metadata = {
  title: "SC Payslip",
  description: "Teilt Profite, Kosten und Steuern fair auf  Star Citizen ready."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body">
        <ToastProvider>
          <LayoutClient>
            {children}
          </LayoutClient>
        </ToastProvider>
      </body>
    </html>
  );
}
