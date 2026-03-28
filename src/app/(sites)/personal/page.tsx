import Link from "next/link";
import { Container } from "@/components/ui/container";

const personalLinks = [
  {
    title: "The Pour is the Point",
    href: "/personal/the-pour-is-the-point",
  },
];

export default function PersonalPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Caf&eacute; <span className="text-accent">655</span> Personal
        </h1>
        <nav className="mt-12 flex flex-col gap-4">
          {personalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border bg-surface px-8 py-4 text-center text-lg font-medium text-foreground transition-all hover:border-accent hover:bg-surface-hover"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      </article>
    </Container>
  );
}
