import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Cafe",
  description: "The central cafe of Cafe655.",
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
