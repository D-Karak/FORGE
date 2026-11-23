import { auth } from "@/lib/auth/server";
import { getOrCreateProfile, getProfile, needsTrainerSetup, type AccountRole } from "@/lib/profiles";

function isAccountRole(value: unknown): value is AccountRole {
  return value === "client" || value === "trainer";
}

export async function GET() {
  const { data: session, error } = await auth.getSession();

  if (error) {
    console.error("Could not read the Neon Auth session.", error);
    return Response.json({ error: "Could not read the current session." }, { status: 500 });
  }

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    return Response.json({ error: "Account profile not found." }, { status: 404 });
  }

  const trainerSetupRequired = profile.role === "trainer"
    ? await needsTrainerSetup(session.user.id)
    : false;

  return Response.json({ profile, trainerSetupRequired });
}

export async function POST(request: Request) {
  const { data: session, error } = await auth.getSession();

  if (error) {
    console.error("Could not read the Neon Auth session.", error);
    return Response.json({ error: "Could not read the current session." }, { status: 500 });
  }

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("role" in body) || !isAccountRole(body.role)) {
    return Response.json({ error: "Choose a valid account type." }, { status: 400 });
  }

  const displayName = "displayName" in body ? body.displayName : undefined;
  if (displayName !== undefined && (
    typeof displayName !== "string" ||
    displayName.trim().length < 1 ||
    displayName.trim().length > 100
  )) {
    return Response.json({ error: "Provide a display name between 1 and 100 characters." }, { status: 400 });
  }

  const profile = await getOrCreateProfile(
    session.user,
    body.role,
    typeof displayName === "string" ? displayName : undefined,
  );
  const trainerSetupRequired = profile.role === "trainer"
    ? await needsTrainerSetup(session.user.id)
    : false;

  return Response.json({ profile, trainerSetupRequired });
}
