import { sql } from "@/lib/db";
import { decodeProfilePhotoDataUrl } from "@/lib/profile-photo.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [trainer] = await sql`
    SELECT to_jsonb(trainer)->>'profile_photo' AS profile_photo
    FROM public.trainer_profiles AS trainer
    WHERE trainer.slug = ${slug} AND trainer.approved = true AND trainer.suspended = false
    LIMIT 1
  `;

  if (!trainer?.profile_photo) {
    return new Response(null, { status: 404 });
  }

  const photo = decodeProfilePhotoDataUrl(trainer.profile_photo);
  if (!photo) {
    console.error("A coach profile contains an invalid photo.");
    return Response.json({ error: "The coach profile photo is unavailable." }, { status: 500 });
  }

  return new Response(photo.image, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
