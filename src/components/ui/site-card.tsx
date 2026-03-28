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
        "group relative flex items-center justify-center rounded-xl border border-border",
        "bg-surface p-6 transition-all duration-200",
        "hover:border-accent hover:bg-surface-hover hover:shadow-[0_0_20px_rgba(227,24,55,0.1)]",
        "aspect-[1.618/1]",
        className
      )}
    >
      <h3 className="text-2xl font-semibold text-foreground text-center leading-tight group-hover:text-accent transition-colors">
        {title}
      </h3>
    </Link>
  );
}
