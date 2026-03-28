import Image from "next/image";
import { Container } from "@/components/ui/container";

export default function BaristaPaintingPage() {
  return (
    <Container className="py-24">
      <article className="relative min-h-[400px]">
        <h1 className="text-4xl font-bold tracking-tight">
          Barista Painting Services
        </h1>
        <p className="mt-4 text-lg text-muted">
          Coming soon.
        </p>

        {/* Painter avatar — feet at bottom of article, head extends up freely */}
        <div className="absolute right-[-50px] bottom-[-225px] z-[60] pointer-events-none overflow-visible">
          <Image
            src="/cafe-painter.png"
            alt="Cafe655 painter with tools and coffee"
            width={400}
            height={400}
            className="w-[540px] sm:w-[660px] lg:w-[840px] h-auto"
            priority
          />
        </div>
      </article>
    </Container>
  );
}
