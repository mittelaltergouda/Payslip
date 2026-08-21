import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const AI_TRAINING_CRAWLERS = ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: AI_TRAINING_CRAWLERS,
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
