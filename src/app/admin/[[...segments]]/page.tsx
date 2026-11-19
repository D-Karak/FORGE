import { auth } from "@/lib/auth/server";
import FitnessPlatform from "@/components/fitness-platform";
import { connection } from "next/server";
import { redirect } from "next/navigation";

export const instant = false;

export default async function AdminRoute() {
  await connection();
  const { data: session, error } = await auth.getSession();

  if (error) {
    throw new Error(`Could not verify admin access: ${error.message}`);
  }

  if (!session?.user) {
    redirect("/login");
  }

  const allowedEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!allowedEmails.has(session.user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  return <FitnessPlatform />;
}
