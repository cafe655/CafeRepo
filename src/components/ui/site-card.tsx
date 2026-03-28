import Link from "next/link";
import { cn } from "@/lib/utils";

interface SiteCardProps {
  href: string;
  title: React.ReactNode;
  description?: string;
  external?: boolean;
  className?: string;
}

export function SiteCard({ href, title, description, external, className }: SiteCardProps) {
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className={cn(
        "group relative flex flex-col justify-end rounded-xl border border-border",
        "bg-surface p-4 transition-all duration-200",
        "hover:border-accent hover:bg-surface-hover hover:shadow-[0_0_20px_rgba(227,24,55,0.1)]",
        "aspect-[1.618/1]",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-muted">{description}</p>
      )}
      <span className="mt-2 inline-flex items-center text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        {external ? "Visit" : "Explore"}
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
