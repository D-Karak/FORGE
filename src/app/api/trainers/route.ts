import { sql } from "@/lib/db";

export async function GET() {
  const trainers = await sql`
    SELECT id, slug, name, title, city, specialty, bio, languages,
           session_price, approved
    FROM public.trainer_profiles
    WHERE approved = true AND suspended = false
    ORDER BY name ASC
  `;

  return Response.json({ trainers });
}
