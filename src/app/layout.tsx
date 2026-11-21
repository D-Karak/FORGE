import type { Metadata } from "next";
import "./globals.css";
import ForgeRealtimeProvider from "@/components/realtime-provider";

export const metadata: Metadata = {
  title: "Forge — Coaching for the long game",
  description: "Find your coach. Find your rhythm. Build a stronger life, one good session at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><ForgeRealtimeProvider>{children}</ForgeRealtimeProvider></body>
    </html>
  );
}
