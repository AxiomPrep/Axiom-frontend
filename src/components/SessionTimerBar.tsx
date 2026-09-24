"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { notifyTimerChanged, TIMER_EVENT } from "@/lib/study-hub-local";

const NAMES: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  biology: "Biology",
};

type Running = {
  label: string;
  startedAt: string;
};

function formatLive(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionTimerBar() {
  const [running, setRunning] = useState<Running | null>(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setRunning(null);
      return;
    }
    try {
      const data = await api<{
        running_session: {
          started_at: string;
          subject_id?: string | null;
          subjects?: { slug?: string; name?: string } | null;
        } | null;
      }>("/api/timer");
      const session = data.running_session;
      if (session?.started_at) {
        const slug = session.subjects?.slug || "";
        setRunning({
          label: session.subjects?.name || NAMES[slug] || "Focus session",
          startedAt: session.started_at,
        });
        return;
      }
      setRunning(null);
    } catch {
      setRunning(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => {
      void refresh();
    };
    window.addEventListener(TIMER_EVENT, onChange);
    window.addEventListener("storage", onChange);
    const poll = getAccessToken() ? window.setInterval(() => void refresh(), 8000) : undefined;
    return () => {
      window.removeEventListener(TIMER_EVENT, onChange);
      window.removeEventListener("storage", onChange);
      if (poll) window.clearInterval(poll);
    };
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsed = running
    ? Math.max(0, Math.floor((Date.now() - new Date(running.startedAt).getTime()) / 1000) + tick * 0)
    : 0;

  async function stop() {
    setBusy(true);
    try {
      await api("/api/timer", { method: "PATCH", body: JSON.stringify({ action: "stop" }) });
      notifyTimerChanged();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!running) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-axiom/20 bg-axiom/[0.07] px-4 py-2 text-sm">
      <p className="min-w-0 truncate text-ink">
        <span className="font-semibold text-axiom">{running.label}</span>
        <span className="mx-2 text-zinc-500">·</span>
        <span className="font-mono tabular-nums">{formatLive(elapsed)}</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/study-hub" className="text-xs font-semibold text-axiom hover:text-axiom-hover">
          Study Hub
        </Link>
        <button type="button" disabled={busy} onClick={() => void stop()} className="btn-ghost h-8 px-3 text-xs">
          Stop
        </button>
      </div>
    </div>
  );
}
