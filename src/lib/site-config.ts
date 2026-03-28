export interface SiteConfig {
  slug: string;
  name: string;
  description: string;
  path: string;
  subdomain?: string;
  icon?: string;
  enabled: boolean;
}

export const sites: SiteConfig[] = [
  {
    slug: "hub",
    name: "The Cafe",
    description: "The central cafe. Updates, links, and everything in between.",
    path: "/hub",
    subdomain: "hub",
    enabled: true,
  },
];

export const siteMetadata = {
  name: "Cafe655",
  domain: "cafe655.com",
  url: "https://cafe655.com",
  description: "The digital cafe of Cafe655.",
};
