"use client";

import { useEffect } from "react";

/**
 * Envia um beacon para /api/view ao carregar a página do anúncio.
 * Fire-and-forget: não bloqueia a renderização nem falha visivelmente.
 */
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const beacon = JSON.stringify({ listingId });
    try {
      navigator.sendBeacon("/api/view", new Blob([beacon], { type: "application/json" }));
    } catch {
      // Fallback: fetch sem await
      fetch("/api/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: beacon,
        keepalive: true,
      }).catch(() => {});
    }
  }, [listingId]);

  return null;
}
