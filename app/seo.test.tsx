import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { SeoIntro } from "@/components/SeoIntro";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  WEB_APPLICATION_STRUCTURED_DATA,
  siteMetadata,
} from "@/lib/seo";

describe("SC Payslip SEO foundation", () => {
  it("describes the Star Citizen crew payout search intent", () => {
    expect(siteMetadata.title).toBe("Star Citizen: aUEC fair aufteilen | SC Payslip");
    expect(siteMetadata.description).toBe(SITE_DESCRIPTION);
    expect(siteMetadata.metadataBase).toEqual(new URL(SITE_URL));
    expect(siteMetadata.alternates?.canonical).toBe("/");
  });

  it("publishes consistent Open Graph and Twitter metadata", () => {
    expect(siteMetadata.openGraph).toMatchObject({
      type: "website",
      locale: "de_DE",
      siteName: SITE_NAME,
      url: "/",
      title: "Star Citizen: aUEC fair aufteilen | SC Payslip",
      description: SITE_DESCRIPTION,
    });
    expect(siteMetadata.twitter).toMatchObject({
      card: "summary",
      title: "Star Citizen: aUEC fair aufteilen | SC Payslip",
      description: SITE_DESCRIPTION,
    });
  });

  it("allows search crawlers while keeping AI training crawlers blocked", () => {
    const result = robots();

    expect(result.rules).toContainEqual({ userAgent: "*", allow: "/" });
    expect(result.rules).toContainEqual({
      userAgent: ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot"],
      disallow: "/",
    });
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(result.host).toBe(SITE_URL);
  });

  it("lists only the intended public pages in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/tool-tipps`,
      `${SITE_URL}/impressum`,
      `${SITE_URL}/datenschutz`,
    ]);
    expect(urls.every((url) => !url.includes("?") && !url.includes("#"))).toBe(true);
  });

  it("renders one clear H1 and an indexable explanation without user data", () => {
    const { container } = render(<SeoIntro />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "aUEC fair aufteilen",
    );
    expect(screen.getByText(/Mining, Salvage, Handel und gemeinsamen Missionen/i)).toBeInTheDocument();
    expect(screen.getByText(/bleiben ausschließlich lokal in deinem Browser/i)).toBeInTheDocument();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("publishes valid WebApplication structured data with no session values", () => {
    expect(WEB_APPLICATION_STRUCTURED_DATA).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
    });

    const serialized = JSON.stringify(WEB_APPLICATION_STRUCTURED_DATA);
    expect(serialized).not.toMatch(/Player 1|"(?:memberId|revenue|investment)":/i);
  });
});
