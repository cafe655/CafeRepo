import { Container } from "@/components/ui/container";

export default function PersonalPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Caf&eacute; <span className="text-accent">655</span> Personal
        </h1>
        <p className="mt-4 text-lg text-muted">
          Coming soon.
        </p>
      </article>
    </Container>
  );
}
