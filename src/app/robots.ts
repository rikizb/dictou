import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/practice", "/words", "/stats", "/api/"],
      },
    ],
    sitemap: "https://www.dictou.com/sitemap.xml",
  };
}
