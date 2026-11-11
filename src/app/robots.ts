import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

// Account and admin areas are private; everything else is open to search engines.
const PRIVATE = ["/api/", "/auth/", "/admin", "/dashboard", "/upgrade"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE, ...PRIVATE.filter((p) => !p.startsWith("/api") && !p.startsWith("/auth")).map((p) => `/ms${p}`)] },
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
