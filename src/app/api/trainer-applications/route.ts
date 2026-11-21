import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const applications = await sql`
    SELECT id, name, city, specialty, languages, approach, status, submitted_at
    FROM public.trainer_applications
    WHERE user_id = ${session.user.id}
    ORDER BY submitted_at DESC
  `;

  return Response.json({ applications });
}

export async function POST(request: Request) {
  const { data: session, error } = await auth.getSession();
  if (error) {
    return Response.json({ error: "Could not verify the session." }, { status: 500 });
  }
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    | { name?: unknown; city?: unknown; specialty?: unknown; languages?: unknown; approach?: unknown }
    | null;

  const fields = body ? [body.name, body.city, body.specialty, body.languages, body.approach] : [];
  if (!body || fields.some((value) => typeof value !== "string" || value.trim().length < 2)) {
    return Response.json({ error: "Complete every application field." }, { status: 400 });
  }

  const id = randomUUID();
  await sql`
    INSERT INTO public.trainer_applications
      (id, user_id, name, city, specialty, languages, approach)
    VALUES
      (${id}, ${session.user.id}, ${body.name as string}, ${body.city as string},
       ${body.specialty as string}, ${body.languages as string}, ${body.approach as string})
  `;

  await sql`
    UPDATE public.user_profiles
    SET role = 'trainer'
    WHERE user_id = ${session.user.id}
  `;

  await sql`
    INSERT INTO public.in_app_notices
      (id, user_id, title, body)
    VALUES
      (${randomUUID()}, ${session.user.id}, 'Application submitted',
       'Your coach application is awaiting review.')
  `;

  return Response.json({ application: { id, status: "pending" } }, { status: 201 });
}
