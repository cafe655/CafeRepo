import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";

const twitchLinks = [
  {
    title: <>Watch<br />Cafe655<br />on Twitch</>,
    href: "https://www.twitch.tv/cafe655",
    external: true,
  },
  {
    title: <>Always Thank<br />the<br />Bus Driver</>,
    href: "/cafe655-on-twitch/always-thank-the-bus-driver",
  },
];

export default function Cafe655OnTwitchPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Cafe<span className="text-accent">655</span> on Twitch
        </h1>
        <nav className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {twitchLinks.map((link) => (
            <SiteCard
              key={link.href}
              href={link.href}
              title={link.title}
              external={link.external}
            />
          ))}
        </nav>
      </article>
    </Container>
  );
}
