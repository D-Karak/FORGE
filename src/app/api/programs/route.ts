import { sql } from "@/lib/db";

export async function GET() {
  const programs = await sql`
    SELECT p.id, p.title, p.category, p.description, p.weeks, p.lessons, p.price,
           tp.slug AS trainer_slug, tp.name AS trainer_name
    FROM public.trainer_programs p
    JOIN public.trainer_profiles tp ON tp.id = p.trainer_id
    WHERE p.status = 'published'
      AND tp.approved = true
      AND tp.suspended = false
    ORDER BY p.created_at DESC
  `;

  return Response.json({ programs });
}
