import { auth } from "@/lib/auth/server";
import { getProfile, needsTrainerSetup } from "@/lib/profiles";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await connection();
  const { data: session, error } = await auth.getSession();

  if (error) {
    throw new Error(`Could not complete sign-in: ${error.message}`);
  }

  if (!session?.user) {
    redirect("/login?error=authentication");
  }

  const { next } = await searchParams;
  const bookingDestination = next?.startsWith("/book-session/") ? next : null;
  const profile = await getProfile(session.user.id);
  if (!profile) {
    redirect(bookingDestination
      ? `/profile-setup?next=${encodeURIComponent(bookingDestination)}`
      : "/profile-setup");
  }

  if (profile.role === "trainer" && await needsTrainerSetup(session.user.id)) {
    redirect("/trainer/apply");
  }

  redirect(profile.role === "trainer"
    ? "/trainer/dashboard"
    : bookingDestination ?? "/dashboard");
}
