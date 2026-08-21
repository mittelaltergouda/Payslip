import type { Metadata } from "next";

export const SITE_URL = "https://payslip.cheesy.cloud";
export const SITE_NAME = "SC Payslip";
export const SITE_TITLE = "Star Citizen: aUEC fair aufteilen | SC Payslip";
export const SITE_DESCRIPTION =
  "Verteile aUEC aus Mining, Salvage, Handel und Missionen fair auf deine Star-Citizen-Crew – inklusive Kosten, Investments und Transfergebühren.";

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | SC Payslip",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const siteMetadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const WEB_APPLICATION_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: "Star Citizen Payslip",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript and local browser storage",
  inLanguage: ["de", "en"],
  isAccessibleForFree: true,
  featureList: [
    "Crew-Auszahlungen berechnen",
    "Kosten und Investments berücksichtigen",
    "Star-Citizen-Transfergebühren einplanen",
    "Ergebnisse als PDF und CSV exportieren",
    "Sessiondaten ausschließlich lokal im Browser speichern",
  ],
} as const;
