import { createRealtime, rawSql } from "@neon/realtime/server";

const secret = process.env.NEON_REALTIME_SECRET;

export function getRealtime() {
  if (!secret) {
    throw new Error("NEON_REALTIME_SECRET is required.");
  }

  return createRealtime({ secret, db: "neondb", debugMode: process.env.NODE_ENV !== "production" });
}

export function bookingsQuery(userId: string) {
  return rawSql<{
    id: string;
    trainer_id: string;
    trainer_name: string;
    client_id: string;
    starts_at: string;
    duration_minutes: number;
    status: string;
  }>(
    `SELECT b.id, b.trainer_id, tp.name AS trainer_name, b.client_id,
            b.starts_at, b.duration_minutes, b.status
       FROM public.bookings b
       JOIN public.trainer_profiles tp ON tp.id = b.trainer_id
      WHERE b.client_id = $1 OR b.trainer_id IN (
        SELECT id FROM public.trainer_profiles WHERE user_id = $1
      )
      ORDER BY b.starts_at ASC`,
    [userId],
  );
}
