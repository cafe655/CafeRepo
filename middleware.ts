import { NextRequest, NextResponse } from "next/server";
import { sites, siteMetadata } from "@/lib/site-config";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const rootDomain = siteMetadata.domain;

  // Extract subdomain (e.g., "music" from "music.cafe655.com")
  // In development, handle localhost variants
  let subdomain: string | null = null;

  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, "");
  } else if (hostname.includes(".localhost")) {
    subdomain = hostname.split(".localhost")[0];
  }

  // Ignore www
  if (subdomain === "www") {
    subdomain = null;
  }

  // If there's a valid subdomain, rewrite to the path-based route
  if (subdomain) {
    const site = sites.find((s) => s.enabled && s.subdomain === subdomain);

    if (site) {
      const url = request.nextUrl.clone();
      url.pathname = `${site.path}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
