import Link from "next/link";
import { Container } from "@/components/ui/container";

const fieldNotes = [
  {
    title: "AI Field Notes Podcast",
    href: "https://www.youtube.com/playlist?list=PL8pCAZvJIBvJXb1VmAFh9gfJ61EgiwKDk",
    external: true,
  },
  {
    title: "AI Field Notes TikTok",
    href: "https://www.tiktok.com/@ai.field.notes",
    external: true,
  },
  {
    title: "Claude Code Reference Guide",
    href: "/ai-field-notes/claude-code-reference",
  },
];

export default function AIFieldNotesPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          AI Field{" "}
          <span className="text-accent">Notes</span>
        </h1>
        <nav className="mt-12 flex flex-col gap-4">
          {fieldNotes.map((note) => (
            <Link
              key={note.href}
              href={note.href}
              {...(note.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rounded-full border border-border bg-surface px-8 py-4 text-center text-lg font-medium text-foreground transition-all hover:border-accent hover:bg-surface-hover"
            >
              {note.title}
            </Link>
          ))}
        </nav>
      </article>
    </Container>
  );
}
