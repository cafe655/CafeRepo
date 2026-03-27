import Link from "next/link";
import type { SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteCard({ site }: { site: SiteConfig }) {
  return (
    <Link
      href={site.path}
      className={cn(
        "group relative block rounded-xl border border-border p-6",
        "bg-surface transition-all duration-200",
        "hover:border-accent hover:bg-surface-hover hover:shadow-[0_0_20px_rgba(227,24,55,0.1)]"
      )}
    >
      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
        {site.name}
      </h3>
      <p className="mt-2 text-sm text-muted">{site.description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        Explore
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </span>
    </Link>
  );
}
