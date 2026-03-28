"use client";

import { Container } from "@/components/ui/container";

const episodes = [
  { id: "2349945946", label: "ATTBD #1" },
  { id: "collection=1wwrN2CGGRhFsw", label: "ATTBD #2", isCollection: true },
  { id: "2351532017", label: "ATTBD #3" },
  { id: "2351539913", label: "ATTBD #4" },
  { id: "2351556517", label: "ATTBD #5" },
  { id: "2351560299", label: "ATTBD #6" },
  { id: "2355217201", label: "ATTBD #7" },
  { id: "2432632969", label: "ATTBD #8" },
  { id: "2432637965", label: "ATTBD #9" },
  { id: "2432639308", label: "ATTBD #10" },
  { id: "2432641102", label: "ATTBD #11" },
  { id: "2432644365", label: "ATTBD #12" },
  { id: "2432645802", label: "ATTBD #13" },
];

function twitchSrc(ep: (typeof episodes)[number]) {
  const parents = "parent=cafe655.com&parent=www.cafe655.com";
  if (ep.isCollection) {
    return `https://player.twitch.tv/?${ep.id}&${parents}`;
  }
  return `https://player.twitch.tv/?video=${ep.id}&${parents}`;
}

export default function AlwaysThankTheBusDriverPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Always Thank the <span className="text-accent">Bus Driver</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Conversations at the intersection of Fortnite, Streaming and Life
        </p>
        <div className="mt-12 flex flex-col gap-8">
          {episodes.map((ep) => (
            <div key={ep.id}>
              <h2 className="mb-3 text-lg font-medium text-foreground">
                {ep.label}
              </h2>
              <div className="aspect-video w-full max-w-3xl">
                <iframe
                  src={twitchSrc(ep)}
                  allowFullScreen
                  className="h-full w-full rounded-lg border border-border"
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    </Container>
  );
}
