"use client";

import { createRealtimeClient, postgresJsParsers } from "@neon/realtime/client";

export function createForgeRealtimeClient(realtimeUrl: string) {
  return createRealtimeClient({
    url: realtimeUrl,
    parsers: { ...postgresJsParsers },
  });
}
