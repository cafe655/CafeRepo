"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteMetadata } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "The Cafe", href: "/hub" },
  { label: "Ai Field Notes", href: "/ai-field-notes" },
  { label: "Barista Painting Services", href: "/barista-painting" },
  { label: "Cafe655 on Twitch", href: "/cafe655-on-twitch" },
  { label: "Cafe655 Personal", href: "/personal" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      {/* Top row: brand only */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
            {siteMetadata.name}
          </span>
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 text-muted hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Border */}
      <div className="border-b border-border" />

      {/* Secondary nav row: links */}
      <div className="hidden md:block border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "text-accent bg-accent-muted"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "text-accent bg-accent-muted"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
