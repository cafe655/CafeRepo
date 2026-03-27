import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";
import { sites } from "@/lib/site-config";

export default function HomePage() {
  const enabledSites = sites.filter((s) => s.enabled);

  return (
    <Container className="py-24">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-foreground">Cafe</span>
          <span className="text-accent">655</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          The digital hub. Explore the spaces below.
        </p>
      </section>

      {/* Sub-site grid */}
      {enabledSites.length > 0 ? (
        <section className="mt-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enabledSites.map((site) => (
              <SiteCard key={site.slug} site={site} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-16 text-center">
          <div className="rounded-xl border border-border bg-surface p-12">
            <p className="text-muted">
              Sub-sites coming soon. Check back later.
            </p>
          </div>
        </section>
      )}
    </Container>
  );
}
