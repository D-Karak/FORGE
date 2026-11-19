import { Suspense } from "react";
import FitnessPlatform from "@/components/fitness-platform";

export default function PlatformRoute() {
  return <Suspense fallback={<main className="loading-screen">FORGE<span>.</span></main>}><FitnessPlatform /></Suspense>;
}
