"use client";

import { type ReactNode, Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthBarrier } from "@/components/AuthBarrier";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { NavigationProgress } from "@/components/NavigationProgress";
import { SessionTimerBar } from "@/components/SessionTimerBar";
import { TrialBar } from "@/components/TrialBar";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { warmupLiveApi } from "@/lib/warmup";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    warmupLiveApi();
  }, []);
  useEffect(() => {
    if (!getAccessToken()) return;
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    if (window.localStorage.getItem("axiom_visit_day") === day) return;
    void api<{ ok: boolean }>("/api/visits", { method: "POST" })
      .then(() => window.localStorage.setItem("axiom_visit_day", day))
      .catch(() => undefined);
  }, []);
  const gated = <AuthBarrier>{children}</AuthBarrier>;
  const progress = (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );

  if (pathname.startsWith("/read") || pathname.startsWith("/reader")) {
    return (
      <div className="flex-1">
        {progress}
        {gated}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {progress}
      <div className="sticky top-[4.5rem] z-30">
        <TrialBar />
        <SessionTimerBar />
      </div>
      <div className="flex-1">{gated}</div>
      <Footer />
    </>
  );
}
