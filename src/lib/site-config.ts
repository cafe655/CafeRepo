export interface SiteConfig {
  slug: string;
  name: string;
  description: string;
  path: string;
  subdomain?: string;
  icon?: string;
  enabled: boolean;
}

export const sites: SiteConfig[] = [];

export const siteMetadata = {
  name: "Cafe655",
  domain: "cafe655.com",
  url: "https://cafe655.com",
  description: "The digital cafe of Cafe655.",
};
