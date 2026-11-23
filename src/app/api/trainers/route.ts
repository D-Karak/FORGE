import { sql } from "@/lib/db";
import { hasProfilePhotoSchema } from "@/lib/profile-photo.server";

export async function GET() {
  const hasPhotoSchema = await hasProfilePhotoSchema();
  const trainers = hasPhotoSchema
    ? await sql`
        SELECT id, slug, name, title, city, specialty, bio, languages,
               session_price, badges, profile_photo IS NOT NULL AS has_profile_photo, approved
        FROM public.trainer_profiles
        WHERE approved = true AND suspended = false
        ORDER BY name ASC
      `
    : await sql`
        SELECT id, slug, name, title, city, specialty, bio, languages,
               session_price, badges, false AS has_profile_photo, approved
        FROM public.trainer_profiles
        WHERE approved = true AND suspended = false
        ORDER BY name ASC
      `;

  return Response.json({ trainers });
}
