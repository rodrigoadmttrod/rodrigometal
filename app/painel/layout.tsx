import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-page">{children}</div>;
}
