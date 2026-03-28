import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";

const mainLinks = [
  { title: <>Ai<br />Field<br />Notes</>, href: "/ai-field-notes" },
  { title: <>Barista<br />Painting<br />Services</>, href: "/barista-painting" },
  { title: <>Cafe655<br />on<br />Twitch</>, href: "/cafe655-on-twitch" },
  { title: <>Cafe655<br />Personal</>, href: "/personal" },
];

export default function HomePage() {
  return (
    <Container className="py-24">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Welcome to the <span className="text-accent">Café</span>
        </h1>
      </section>

      {/* Cards */}
      <section className="mt-32">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mainLinks.map((link, i) =>
            i === 3 ? (
              <div key={link.href} className="relative">
                {/* Avatar standing on top of the card */}
                <div className="absolute bottom-[calc(100%-4px)] left-[35%] -translate-x-1/2 z-[60] pointer-events-none">
                  <Image
                    src="/cafe-avatar.png"
                    alt="Cafe655 avatar holding a coffee mug"
                    width={280}
                    height={480}
                    className="w-[160px] sm:w-[200px] lg:w-[240px] h-auto"
                    priority
                  />
                </div>
                <SiteCard href={link.href} title={link.title} />
              </div>
            ) : (
              <SiteCard
                key={link.href}
                href={link.href}
                title={link.title}
              />
            )
          )}
        </div>
      </section>
    </Container>
  );
}
