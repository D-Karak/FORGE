import { auth } from "@/lib/auth/server";
import { getOrCreateProfile } from "@/lib/profiles";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  await connection();
  const { data: session, error } = await auth.getSession();

  if (error) {
    throw new Error(`Could not complete sign-in: ${error.message}`);
  }

  if (!session?.user) {
    redirect("/login?error=authentication");
  }

  const { role } = await searchParams;
  const profile = await getOrCreateProfile(
    session.user,
    role === "trainer" ? "trainer" : "client",
  );

  redirect(profile.role === "trainer" ? "/trainer/dashboard" : "/dashboard");
}
