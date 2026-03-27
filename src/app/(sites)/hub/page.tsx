import { Container } from "@/components/ui/container";

export default function HubPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          The <span className="text-accent">Hub</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          This space is under construction. More coming soon.
        </p>
      </article>
    </Container>
  );
}
