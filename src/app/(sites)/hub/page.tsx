import Link from "next/link";
import { Container } from "@/components/ui/container";

const hubLinks = [
  { label: "AI Field Notes", href: "/ai-field-notes" },
  { label: "Barista Painting Services", href: "/barista-painting" },
  {
    label: (
      <>
        Caf&eacute; <span className="text-accent">655</span> Personal
      </>
    ),
    href: "/personal",
  },
];

export default function HubPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          The <span className="text-accent">Hub</span>
        </h1>
        <nav className="mt-12 flex flex-col gap-4">
          {hubLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border bg-surface px-8 py-4 text-center text-lg font-medium text-foreground transition-all hover:border-accent hover:bg-surface-hover"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </article>
    </Container>
  );
}
