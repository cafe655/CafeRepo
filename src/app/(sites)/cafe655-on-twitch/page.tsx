import Link from "next/link";
import { Container } from "@/components/ui/container";

const twitchLinks = [
  {
    title: "Watch Cafe655 on Twitch",
    href: "https://www.twitch.tv/cafe655",
    external: true,
  },
  {
    title: "Always Thank the Bus Driver",
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
        <nav className="mt-12 flex flex-col gap-4">
          {twitchLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
