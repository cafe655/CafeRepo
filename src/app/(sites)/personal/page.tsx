import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";

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
          Cafe<span className="text-accent">655</span> Personal
        </h1>
        <nav className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personalLinks.map((link) => (
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
