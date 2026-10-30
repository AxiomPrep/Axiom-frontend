"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Shell } from "@/components/ui";
import { PageLoader } from "@/components/BrandLoader";
import { listMentors, openMentorChat, type ChatAccess, type MentorCard } from "@/lib/chat-api";
import { ApiClientError } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export default function MentorsPage() {
  const router = useRouter();
  const [access, setAccess] = useState<ChatAccess | null>(null);
  const [mentors, setMentors] = useState<MentorCard[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listMentors()
      .then((data) => {
        if (!alive) return;
        setAccess(data.access);
        setMentors(data.mentors);
        setIsMentor(data.is_mentor);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load mentors");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function openChat(mentor: MentorCard, kind: "direct" | "community") {
    if (!getAccessToken()) {
      const next = kind === "direct" ? `/mentors/${mentor.slug || mentor.id}/chat` : "/mentors";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!mentor.allowed) {
      router.push("/subscription");
      return;
    }
    if (kind === "direct") {
      router.push(`/mentors/${mentor.slug || mentor.id}/chat`);
      return;
    }
    setOpening(`${mentor.id}:${kind}`);
    try {
      const result = await openMentorChat(mentor.id, kind);
      router.push(`/mentors/community/${result.conversation_id}`);
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.status === 402
          ? "An active mentorship plan is required."
          : err instanceof Error
            ? err.message
            : "Could not open chat";
      setError(message);
    } finally {
      setOpening(null);
    }
  }

  if (loading) {
    return (
      <Shell>
        <PageLoader label="Mentors" />
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Talk to a mentor"
        title="Connect with your mentors"
        subtitle="Get help with your preparation from your subscribed mentors. Private chat for personal doubts, community for shared discussion."
      />
      {isMentor ? (
        <p className="mb-6">
          <Link href="/mentor-inbox" className="text-sm text-axiom hover:text-axiom-hover">
            Open mentor inbox →
          </Link>
        </p>
      ) : null}
      {!access?.ok ? (
        <div className="mb-8 rounded-2xl border border-line bg-card px-5 py-5">
          <p className="font-display text-xl text-ink">Mentorship required</p>
          <p className="mt-2 text-sm text-zinc-400">Subscribe to Gold, Diamond, or Platinum to start chatting.</p>
          <Link href="/subscription" className="btn-primary mt-4 inline-flex h-11 px-5 text-sm">
            View mentorship plans
          </Link>
        </div>
      ) : (
        <p className="mb-6 text-sm text-zinc-400">
          Active {access.track?.toUpperCase()} plan · {access.tier === "b" ? "Diamond / Platinum" : "Gold"} access
        </p>
      )}
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {mentors.map((mentor) => (
          <article key={mentor.id} className="rounded-2xl border border-line bg-card px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-axiom">
              {mentor.exam_track.toUpperCase()} · {(mentor.subjects || []).slice(0, 2).join(" · ") || "Mentor"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{mentor.full_name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{mentor.role_label}</p>
            <p className="mt-2 text-xs text-axiom">
              {mentor.online ? "Available" : "Offline · Replies later"}
              {mentor.required_tier === "b" ? " · Diamond / Platinum" : ""}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-500">
              {(mentor.highlights || []).slice(0, 2).map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={Boolean(opening)}
                onClick={() => void openChat(mentor, "direct")}
                className={`h-10 px-4 text-sm ${mentor.allowed ? "btn-primary" : "btn-ghost"}`}
              >
                {opening === `${mentor.id}:direct` ? "Opening…" : mentor.allowed ? "Private chat" : "Unlock with plan"}
              </button>
              <button
                type="button"
                disabled={Boolean(opening) || !mentor.allowed}
                onClick={() => void openChat(mentor, "community")}
                className="btn-ghost h-10 px-4 text-sm"
              >
                {opening === `${mentor.id}:community` ? "Opening…" : "Community"}
              </button>
            </div>
            {!mentor.allowed && mentor.locked_reason ? (
              <p className="mt-3 text-xs text-zinc-500">{mentor.locked_reason}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Shell>
  );
}
