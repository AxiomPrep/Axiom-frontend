"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SessionTimerBar } from "@/components/SessionTimerBar";
import { TrialBar } from "@/components/TrialBar";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/read") || pathname.startsWith("/reader")) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="sticky top-[4.5rem] z-30">
        <TrialBar />
        <SessionTimerBar />
      </div>
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
