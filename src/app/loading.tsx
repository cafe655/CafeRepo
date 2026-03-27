import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="flex flex-1 items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
    </Container>
  );
}
