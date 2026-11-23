import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { hasProfilePhotoSchema } from "@/lib/profile-photo.server";

function isAdmin(email: string) {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user || !isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const hasPhotoSchema = await hasProfilePhotoSchema();
  const applications = hasPhotoSchema
    ? await sql`
        SELECT id, user_id, name, city, specialty, languages, approach, badges, session_price,
               profile_photo IS NOT NULL AS has_profile_photo, status, submitted_at
        FROM public.trainer_applications
        ORDER BY submitted_at DESC
      `
    : await sql`
        SELECT id, user_id, name, city, specialty, languages, approach, badges, session_price,
               false AS has_profile_photo, status, submitted_at
        FROM public.trainer_applications
        ORDER BY submitted_at DESC
      `;

  return Response.json({ applications });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user || !isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as
    | { applicationId?: unknown; decision?: unknown }
    | null;

  if (typeof body?.applicationId !== "string" || !["approved", "rejected"].includes(String(body.decision))) {
    return Response.json({ error: "Provide an application and valid decision." }, { status: 400 });
  }

  const hasPhotoSchema = await hasProfilePhotoSchema();
  const [application] = hasPhotoSchema
    ? await sql`
        SELECT id, user_id, name, city, specialty, languages, approach, badges, session_price, profile_photo
        FROM public.trainer_applications
        WHERE id = ${body.applicationId}
        LIMIT 1
      `
    : await sql`
        SELECT id, user_id, name, city, specialty, languages, approach, badges, session_price,
               NULL::text AS profile_photo
        FROM public.trainer_applications
        WHERE id = ${body.applicationId}
        LIMIT 1
      `;

  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  const decision = body.decision as "approved" | "rejected";
  await sql`
    UPDATE public.trainer_applications
    SET status = ${decision}, reviewed_at = now()
    WHERE id = ${application.id}
  `;

  if (decision === "approved") {
    const slug = application.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (application.profile_photo) {
      await sql`
        INSERT INTO public.trainer_profiles
          (id, user_id, slug, name, title, city, specialty, bio, languages, session_price, badges, profile_photo, approved)
        VALUES
          (${application.id}, ${application.user_id}, ${slug},
           ${application.name}, ${application.specialty}, ${application.city},
           ${application.specialty},
           ${application.approach},
           ${application.languages.split(",").map((value: string) => value.trim()).filter(Boolean)},
           ${application.session_price}, ${application.badges}, ${application.profile_photo}, true)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          city = EXCLUDED.city,
          specialty = EXCLUDED.specialty,
          bio = EXCLUDED.bio,
          languages = EXCLUDED.languages,
          session_price = EXCLUDED.session_price,
          badges = EXCLUDED.badges,
          profile_photo = EXCLUDED.profile_photo,
          approved = true
      `;
    } else {
      await sql`
        INSERT INTO public.trainer_profiles
          (id, user_id, slug, name, title, city, specialty, bio, languages, session_price, badges, approved)
        VALUES
          (${application.id}, ${application.user_id}, ${slug},
           ${application.name}, ${application.specialty}, ${application.city},
           ${application.specialty},
           ${application.approach},
           ${application.languages.split(",").map((value: string) => value.trim()).filter(Boolean)},
           ${application.session_price}, ${application.badges}, true)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          city = EXCLUDED.city,
          specialty = EXCLUDED.specialty,
          bio = EXCLUDED.bio,
          languages = EXCLUDED.languages,
          session_price = EXCLUDED.session_price,
          badges = EXCLUDED.badges,
          approved = true
      `;
    }

    await sql`
      UPDATE public.user_profiles
      SET role = 'trainer'
      WHERE user_id = ${application.user_id}
    `;
  }

  return Response.json({ applicationId: application.id, decision });
}
