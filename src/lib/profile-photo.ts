export const PROFILE_PHOTO_MAX_BYTES = 500 * 1024;

const PROFILE_PHOTO_PATTERN =
  /^data:(image\/(?:jpeg|png|webp));base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/;

export function parseProfilePhotoDataUrl(value: unknown) {
  if (typeof value !== "string") return null;

  const match = PROFILE_PHOTO_PATTERN.exec(value);
  if (!match || match[2].length === 0) return null;

  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  const byteLength = (match[2].length / 4) * 3 - padding;
  if (byteLength <= 0 || byteLength >= PROFILE_PHOTO_MAX_BYTES) return null;

  return { mimeType: match[1], base64: match[2], byteLength };
}
