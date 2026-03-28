"use client";

import { Container } from "@/components/ui/container";

export default function AlwaysLinkTheBusDriverPage() {
  return (
    <Container className="py-24">
      <article>
        <h1 className="text-4xl font-bold tracking-tight">
          Always Link the <span className="text-accent">Bus Driver</span>
        </h1>
        <div className="mt-12">
          <div className="aspect-video w-full max-w-3xl">
            <iframe
              src="https://player.twitch.tv/?collection=1wwrN2CGGRhFsw&parent=cafe655.com&parent=www.cafe655.com"
              allowFullScreen
              className="h-full w-full rounded-lg border border-border"
            />
          </div>
        </div>
      </article>
    </Container>
  );
}
