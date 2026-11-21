import { auth } from "@/lib/auth/server";
import { bookingsQuery, getRealtime } from "@/lib/realtime/server";
import { connection } from "next/server";

export async function GET() {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const realtime = getRealtime();
  const sealed = await realtime.seal({ query: bookingsQuery(session.user.id) });
  return Response.json({ sealed });
}
