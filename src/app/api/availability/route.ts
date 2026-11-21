import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const slots = await sql`
    SELECT s.id, s.starts_at, s.duration_minutes, s.is_active
    FROM public.availability_slots s
    JOIN public.trainer_profiles tp ON tp.id = s.trainer_id
    WHERE tp.user_id = ${session.user.id}
    ORDER BY s.starts_at ASC
  `;

  return Response.json({ slots });
}

export async function PUT(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    | { startsAt?: unknown; durationMinutes?: unknown }
    | null;

  if (
    typeof body?.startsAt !== "string" ||
    !Number.isInteger(body.durationMinutes) ||
    (body.durationMinutes as number) < 15
  ) {
    return Response.json({ error: "Provide a valid start time and duration." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return Response.json({ error: "Availability must be in the future." }, { status: 400 });
  }

  const [profile] = await sql`
    SELECT id
    FROM public.trainer_profiles
    WHERE user_id = ${session.user.id} AND approved = true AND suspended = false
    LIMIT 1
  `;

  if (!profile) {
    return Response.json({ error: "Approved trainer profile required." }, { status: 403 });
  }

  const [slot] = await sql`
    INSERT INTO public.availability_slots
      (id, trainer_id, starts_at, duration_minutes)
    VALUES
      (${randomUUID()}, ${profile.id}, ${startsAt.toISOString()}, ${body.durationMinutes as number})
    ON CONFLICT (trainer_id, starts_at) DO UPDATE
      SET is_active = true,
          duration_minutes = EXCLUDED.duration_minutes
    RETURNING id, trainer_id, starts_at, duration_minutes, is_active
  `;

  return Response.json({ slot }, { status: 201 });
}
