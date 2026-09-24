"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onAuthChange } from "@/lib/auth";
import { formatCountdown, readTrialState, type TrialState } from "@/lib/entitlement";
import { getAccessToken } from "@/lib/session";

export function TrialBar() {
  const pathname = usePathname();
  const [trial, setTrial] = useState<TrialState | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!getAccessToken()) {
        if (!cancelled) setTrial(null);
        return;
      }
      const [me, dashboard] = await Promise.allSettled([
        api<unknown>("/api/me"),
        api<unknown>("/api/student/dashboard"),
      ]);
      if (cancelled) return;
      setTrial(
        readTrialState(
          me.status === "fulfilled" ? me.value : null,
          dashboard.status === "fulfilled" ? dashboard.value : null,
        ),
      );
    };
    const stop = onAuthChange(() => {
      void load();
    });
    void load();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  useEffect(() => {
    if (!trial) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [trial]);

  if (!trial || pathname === "/login") return null;
  const remaining = trial.endsAt - now;
  if (remaining <= 0) return null;

  return (
    <div className="border-b border-[#8a6a38] bg-axiom text-[#2c2418]">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 text-[12px] font-medium sm:px-6">
        <p className="flex shrink-0 items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2c2418]" />
          Trial Active
        </p>
        <p className="min-w-0 truncate text-center tabular-nums">
          Trial countdown: {formatCountdown(remaining)}
        </p>
        <Link href="/subscription" className="shrink-0 hover:opacity-80">
          Subscription →
        </Link>
      </div>
    </div>
  );
}
