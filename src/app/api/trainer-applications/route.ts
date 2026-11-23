import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { getProfile } from "@/lib/profiles";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const applications = await sql`
      SELECT id, name, city, specialty, languages, approach, badges, session_price, status, submitted_at
      FROM public.trainer_applications
      WHERE user_id = ${session.user.id}
      ORDER BY submitted_at DESC
    `;

    const profile = await getProfile(session.user.id);
    return Response.json({ applications, profileRole: profile?.role ?? null });
  } catch (error) {
    console.error("Could not load the coach application.", error);
    return Response.json(
      { error: "Could not load your coach application. Please try again later." },
      { status: 500 },
    );
  }
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
    | {
        name?: unknown;
        city?: unknown;
        specialty?: unknown;
        languages?: unknown;
        approach?: unknown;
        badges?: unknown;
        sessionPrice?: unknown;
      }
    | null;

  if (
    !body ||
    typeof body.name !== "string" || body.name.trim().length < 2 ||
    typeof body.city !== "string" || body.city.trim().length < 2 ||
    typeof body.specialty !== "string" || body.specialty.trim().length < 2 ||
    typeof body.languages !== "string" || body.languages.trim().length < 2 ||
    typeof body.approach !== "string" || body.approach.trim().length < 2
  ) {
    return Response.json({ error: "Complete every application field." }, { status: 400 });
  }

  if (
    typeof body.badges !== "string" ||
    typeof body.sessionPrice !== "number" ||
    !Number.isInteger(body.sessionPrice) ||
    body.sessionPrice < 1 ||
    body.sessionPrice > 100000
  ) {
    return Response.json({ error: "Enter valid credentials and a session charge between ₹1 and ₹100,000." }, { status: 400 });
  }

  const [existingApplication] = await sql`
    SELECT id
    FROM public.trainer_applications
    WHERE user_id = ${session.user.id} AND status = 'pending'
    LIMIT 1
  `;
  if (existingApplication) {
    return Response.json({ error: "Your coach application is already being reviewed." }, { status: 409 });
  }

  const badges = body.badges.split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
  const id = randomUUID();
  try {
    await sql`
      INSERT INTO public.trainer_applications
        (id, user_id, name, city, specialty, languages, approach, badges, session_price)
      VALUES
        (${id}, ${session.user.id}, ${body.name.trim()}, ${body.city.trim()},
         ${body.specialty.trim()}, ${body.languages.trim()}, ${body.approach.trim()},
         ${badges}, ${body.sessionPrice})
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
  } catch (error) {
    console.error("Could not submit the coach application.", error);
    return Response.json(
      { error: "Could not submit your coach application. Please try again later." },
      { status: 500 },
    );
  }
}
