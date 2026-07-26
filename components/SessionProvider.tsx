"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// next-auth SessionProvider uses useState/useEffect which can't run during
// static prerendering (e.g. _not-found). Load it client-side only.
const NextAuthSessionProvider = dynamic(
  () => import("next-auth/react").then((m) => m.SessionProvider),
  { ssr: false }
);

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
