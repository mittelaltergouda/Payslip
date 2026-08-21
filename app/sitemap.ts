import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PUBLIC_ROUTES = ["/", "/tool-tipps", "/impressum", "/datenschutz"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "/" ? "monthly" : "yearly",
    priority: route === "/" ? 1 : route === "/tool-tipps" ? 0.7 : 0.2,
  }));
}
