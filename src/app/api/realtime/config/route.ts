export async function GET() {
  const url = process.env.NEON_REALTIME_URL;
  if (!url) {
    return Response.json({ error: "Realtime is not configured." }, { status: 503 });
  }

  return Response.json({ url });
}
