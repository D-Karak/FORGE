import { neon } from "@neondatabase/serverless";

export type AccountRole = "client" | "trainer";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const sql = neon(databaseUrl);

function parseRole(value: unknown): AccountRole {
  if (value === "client" || value === "trainer") {
    return value;
  }

  throw new Error("The account profile contains an invalid role.");
}

export async function getProfile(userId: string): Promise<{ role: AccountRole } | null> {
  const [profile] = await sql`
    SELECT role
    FROM public.user_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return profile ? { role: parseRole(profile.role) } : null;
}

export async function getOrCreateProfile(
  user: { id: string; name?: string | null },
  role: AccountRole,
): Promise<{ role: AccountRole }> {
  const existing = await getProfile(user.id);
  if (existing) {
    return existing;
  }

  await sql`
    INSERT INTO public.user_profiles (user_id, role, display_name)
    VALUES (${user.id}, ${role}, ${user.name ?? null})
    ON CONFLICT (user_id) DO NOTHING
  `;

  const created = await getProfile(user.id);
  if (!created) {
    throw new Error("Could not create the account profile.");
  }

  return created;
}

export async function needsTrainerSetup(userId: string): Promise<boolean> {
  const [trainer] = await sql`
    SELECT id
    FROM public.trainer_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (trainer) {
    return false;
  }

  const [application] = await sql`
    SELECT status
    FROM public.trainer_applications
    WHERE user_id = ${userId}
    ORDER BY submitted_at DESC
    LIMIT 1
  `;

  return application?.status !== "approved";
}
