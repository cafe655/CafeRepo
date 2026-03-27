import type { Metadata } from "next";

// Change this metadata for your sub-site
export const metadata: Metadata = {
  title: "Sub-site Name",
  description: "Description of this sub-site.",
};

export default function SubSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
