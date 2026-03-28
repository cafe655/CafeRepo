import { Container } from "@/components/ui/container";
import { SiteCard } from "@/components/ui/site-card";

const fieldNotes = [
  {
    title: <>Ai Field<br />Notes<br />Podcast</>,
    href: "https://www.youtube.com/playlist?list=PL8pCAZvJIBvJXb1VmAFh9gfJ61EgiwKDk",
    external: true,
  },
  {
    title: <>Ai Field<br />Notes<br />TikTok</>,
    href: "https://www.tiktok.com/@ai.field.notes",
    external: true,
  },
  {
    title: <>Claude Code<br />Reference<br />Guide</>,
    href: "/ai-field-notes/claude-code-reference",
  },
];

export default function AIFieldNotesPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Ai Field{" "}
          <span className="text-accent">Notes</span>
        </h1>
        <nav className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fieldNotes.map((note) => (
            <SiteCard
              key={note.href}
              href={note.href}
              title={note.title}
              external={note.external}
            />
          ))}
        </nav>
      </article>
    </Container>
  );
}
