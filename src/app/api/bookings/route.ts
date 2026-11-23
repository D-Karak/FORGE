import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bookings = await sql`
    SELECT b.id, b.trainer_id, tp.name AS trainer_name,
           b.starts_at, b.duration_minutes, b.status, b.created_at
    FROM public.bookings b
    JOIN public.trainer_profiles tp ON tp.id = b.trainer_id
    WHERE b.client_id = ${session.user.id}
       OR tp.user_id = ${session.user.id}
    ORDER BY b.starts_at ASC
  `;

  return Response.json({ bookings });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    | { trainerSlug?: unknown; startsAt?: unknown; durationMinutes?: unknown }
    | null;

  if (typeof body?.trainerSlug !== "string" || typeof body.startsAt !== "string") {
    return Response.json({ error: "Choose a trainer and start time." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  const now = Date.now();
  const twelveHours = 12 * 60 * 60 * 1000;
  const sixtyDays = 60 * 24 * 60 * 60 * 1000;

  if (
    Number.isNaN(startsAt.getTime()) ||
    startsAt.getTime() < now + twelveHours ||
    startsAt.getTime() > now + sixtyDays
  ) {
    return Response.json({ error: "Sessions must be booked 12 hours to 60 days ahead." }, { status: 400 });
  }

  const [trainer] = await sql`
    SELECT id
    FROM public.trainer_profiles
    WHERE slug = ${body.trainerSlug} AND approved = true AND suspended = false
    LIMIT 1
  `;

  if (!trainer) {
    return Response.json({ error: "Trainer not found." }, { status: 404 });
  }

  const [booking] = await sql`
    WITH claimed_slot AS (
      UPDATE public.availability_slots
      SET is_active = false
      WHERE trainer_id = ${trainer.id}
        AND starts_at = ${startsAt.toISOString()}
        AND starts_at >= NOW() + INTERVAL '12 hours'
        AND starts_at <= NOW() + INTERVAL '60 days'
        AND is_active = true
      RETURNING id, trainer_id, starts_at, duration_minutes
    )
    INSERT INTO public.bookings
      (id, slot_id, trainer_id, client_id, starts_at, duration_minutes)
    SELECT ${randomUUID()}, id, trainer_id, ${session.user.id}, starts_at, duration_minutes
    FROM claimed_slot
    RETURNING id, slot_id, trainer_id, client_id, starts_at, duration_minutes, status
  `;

  if (!booking) {
    return Response.json({ error: "That session time is no longer available. Choose another time." }, { status: 409 });
  }

  await sql`
    INSERT INTO public.in_app_notices
      (id, user_id, title, body)
    VALUES
      (${randomUUID()}, ${session.user.id}, 'Session confirmed',
       'Your coaching session is confirmed.')
  `;

  return Response.json({ booking }, { status: 201 });
}
