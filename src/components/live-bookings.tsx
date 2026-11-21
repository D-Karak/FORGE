"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "@neon/realtime-react";
import type { SealedLiveQuery } from "@neon/realtime/client";

type LiveBooking = {
  id: string;
  trainer_id: string;
  trainer_name: string;
  client_id: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
};

export default function LiveBookings() {
  const [sealed, setSealed] = useState<SealedLiveQuery<LiveBooking> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/realtime/bookings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(response.status === 401 ? "Sign in to view live bookings." : "Could not load live bookings.");
        }
        const result = await response.json() as { sealed: SealedLiveQuery<LiveBooking> };
        if (active) setSealed(result.sealed);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Live booking updates unavailable.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="auth-error" role="alert">{error}</p>;
  if (!sealed) return null;

  return <LiveBookingRows sealed={sealed} />;
}

function LiveBookingRows({ sealed }: { sealed: SealedLiveQuery<LiveBooking> }) {
  const { data, status, error } = useLiveQuery(sealed, {
    refreshQuery: async () => {
      const response = await fetch("/api/realtime/bookings", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not renew live booking updates.");
      return (await response.json() as { sealed: SealedLiveQuery<LiveBooking> }).sealed;
    },
  });

  if (status === "error") {
    return <p className="auth-error" role="alert">{error?.message ?? "Live updates stopped."}</p>;
  }

  if (!data) return null;

  return (
    <div className="live-booking-list" aria-live="polite">
      {status === "stale" && <p className="auth-error">Live updates are reconnecting…</p>}
      {data.map((booking) => (
        <article className="booking-card" key={booking.id}>
          <div className="booking-card-main">
            <span className="status-pill">{booking.status.toUpperCase()}</span>
            <h3>{booking.trainer_name}</h3>
            <p>{new Date(booking.starts_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} · {booking.duration_minutes} minutes</p>
          </div>
        </article>
      ))}
      {data.length === 0 && <p className="muted-copy">No live bookings yet.</p>}
    </div>
  );
}
