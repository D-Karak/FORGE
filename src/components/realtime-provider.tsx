"use client";

import { RealtimeProvider } from "@neon/realtime-react";
import { useEffect, useState, type ReactNode } from "react";
import type { RealtimeClient } from "@neon/realtime/client";
import { createForgeRealtimeClient } from "@/lib/realtime/client";

export default function ForgeRealtimeProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<RealtimeClient | null>(null);

  useEffect(() => {
    let active = true;

    async function configure() {
      try {
        const response = await fetch("/api/realtime/config", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { url?: string };
        if (active && result.url) setClient(createForgeRealtimeClient(result.url));
      } catch {
        // Realtime is optional; normal API and page behavior continues.
      }
    }

    void configure();
    return () => {
      active = false;
    };
  }, []);

  if (!client) {
    return children;
  }

  return <RealtimeProvider client={client}>{children}</RealtimeProvider>;
}
