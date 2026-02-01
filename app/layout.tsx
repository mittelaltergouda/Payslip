import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SC Payslip",
  description: "Teilt Profite, Kosten und Steuern fair auf — Star Citizen ready."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
