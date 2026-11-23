import { Buffer } from "node:buffer";
import { sql } from "@/lib/db";
import { parseProfilePhotoDataUrl } from "@/lib/profile-photo";

export async function hasProfilePhotoSchema() {
  const [columns] = await sql`
    SELECT COUNT(*) = 2 AS ready
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'profile_photo'
      AND table_name IN ('trainer_applications', 'trainer_profiles')
  `;
  return columns?.ready === true;
}

export function decodeProfilePhotoDataUrl(value: unknown) {
  const photo = parseProfilePhotoDataUrl(value);
  if (!photo) return null;

  const image = Buffer.from(photo.base64, "base64");
  if (image.length !== photo.byteLength || image.toString("base64") !== photo.base64) {
    return null;
  }

  const hasValidSignature =
    photo.mimeType === "image/jpeg"
      ? image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
      : photo.mimeType === "image/png"
        ? image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : image.length >= 12 &&
          image.toString("ascii", 0, 4) === "RIFF" &&
          image.toString("ascii", 8, 12) === "WEBP";

  return hasValidSignature ? { mimeType: photo.mimeType, image } : null;
}
