import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";

const hubLinks = [
  { title: "Ai Field Notes", href: "/ai-field-notes" },
  { title: "Barista Painting Services", href: "/barista-painting" },
  { title: "Cafe655 on Twitch", href: "/cafe655-on-twitch" },
  { title: "Cafe655 Personal", href: "/personal" },
];

export default function HubPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          The <span className="text-accent">Cafe</span>
        </h1>
        <nav className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hubLinks.map((link) => (
            <SiteCard
              key={link.href}
              href={link.href}
              title={link.title}
            />
          ))}
        </nav>
      </article>
    </Container>
  );
}
