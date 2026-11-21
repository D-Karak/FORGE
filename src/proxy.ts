import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
  publicRoutes: [
    "/",
    "/discover",
    "/programs",
    "/trainers",
    "/login",
    "/trainer/apply",
    "/auth/callback",
    "/api/profile",
    "/api/trainers",
    "/api/programs",
    "/api/trainer-applications",
    "/api/availability",
    "/api/bookings",
    "/api/trainer-programs",
    "/api/realtime/config",
    "/api/realtime/bookings",
    "/api/admin/trainer-applications",
  ],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
