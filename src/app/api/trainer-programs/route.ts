import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    const published = await sql`
      SELECT p.id, p.title, p.category, p.description, p.weeks, p.lessons, p.price,
             tp.name AS trainer_name
      FROM public.trainer_programs p
      JOIN public.trainer_profiles tp ON tp.id = p.trainer_id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
    `;
    return Response.json({ programs: published });
  }

  const programs = await sql`
    SELECT p.id, p.title, p.category, p.description, p.weeks, p.lessons, p.price, p.status
    FROM public.trainer_programs p
    JOIN public.trainer_profiles tp ON tp.id = p.trainer_id
    WHERE tp.user_id = ${session.user.id}
    ORDER BY p.created_at DESC
  `;

  return Response.json({ programs });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as
    | { title?: unknown; category?: unknown; description?: unknown; weeks?: unknown; lessons?: unknown; price?: unknown }
    | null;

  if (
    typeof body?.title !== "string" ||
    typeof body.category !== "string" ||
    typeof body.description !== "string" ||
    !Number.isInteger(body.weeks) ||
    !Number.isInteger(body.lessons) ||
    !Number.isInteger(body.price)
  ) {
    return Response.json({ error: "Complete the program details." }, { status: 400 });
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

  const id = randomUUID();
  await sql`
    INSERT INTO public.trainer_programs
      (id, trainer_id, title, category, description, weeks, lessons, price, status)
    VALUES
      (${id}, ${profile.id}, ${body.title as string}, ${body.category as string},
       ${body.description as string}, ${body.weeks as number}, ${body.lessons as number},
       ${body.price as number}, 'draft')
  `;

  return Response.json({ program: { id, status: "draft" } }, { status: 201 });
}
