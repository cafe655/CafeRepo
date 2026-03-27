import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hub",
  description: "The central hub of Cafe655.",
};

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
