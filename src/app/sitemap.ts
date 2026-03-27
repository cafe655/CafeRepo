import type { MetadataRoute } from "next";
import { sites, siteMetadata } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteMetadata.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const siteRoutes: MetadataRoute.Sitemap = sites
    .filter((s) => s.enabled)
    .map((site) => ({
      url: `${baseUrl}${site.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...siteRoutes];
}
