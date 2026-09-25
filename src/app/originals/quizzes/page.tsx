"use client";

import Link from "next/link";
import { useState } from "react";
import { CurriculumPicker, CurriculumValue } from "@/components/CurriculumPicker";
import { readerHref } from "@/lib/reader";
import { api } from "@/lib/api";
import { saveAttempt } from "@/lib/attempts";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Shell } from "@/components/ui";
import { useRouter } from "next/navigation";

type QuizzesResponse = {
  chapter_id: string;
  tiers: { key: string; name: string; purpose: string; default_limit: number; available_tests: number }[];
  named_quizzes: { id: string; title: string; quiz_tier: string | null; question_count: number; duration_sec: number }[];
  community_banner: { title: string; href: string };
};

export default function QuizzesPage() {
  const router = useRouter();
  const [curr, setCurr] = useState<CurriculumValue | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { data, error, loading } = useApi<QuizzesResponse>(
    curr?.chapterId ? `/catalog/originals/quizzes?chapter_id=${curr.chapterId}` : null
  );
  const discord = useApi<{ discord_invite_url: string; title: string; description: string }>(
    "/api/community/discord"
  );

  async function startTier(tier: string) {
    if (!curr?.chapterId) return;
    setBusy(tier);
    setMessage(null);
    try {
      const result = await api<{
        attempt: { id: string };
        questions: unknown[];
        test: { duration_sec?: number; title?: string };
      }>("/api/originals/quizzes", {
        method: "POST",
        body: JSON.stringify({ chapter_id: curr.chapterId, quiz_tier: tier, limit: 25 }),
      });
      saveAttempt({
        attempt: result.attempt,
        questions: result.questions as never,
        duration_sec: result.test?.duration_sec,
        title: result.test?.title,
      });
      router.push(`/attempts/${result.attempt.id}`);
    } catch {
      router.push(
        `/practice/player?chapter=${curr.chapterId}&quizTier=${tier}&tierName=${encodeURIComponent(tier)}`,
      );
    } finally {
      setBusy(null);
    }
  }

  async function startNamed(id: string, title: string) {
    if (id.startsWith("admin_") || id.startsWith("mock_")) {
      router.push(`/practice/player?set=${id}&chapter=${curr?.chapterId || ""}&tierName=${encodeURIComponent(title)}`);
      return;
    }
    setBusy(id);
    setMessage(null);
    try {
      const result = await api<{
        attempt: { id: string };
        questions: unknown[];
        duration_sec?: number;
      }>(`/api/tests/${id}/start`, { method: "POST", body: "{}" });
      saveAttempt({
        attempt: result.attempt,
        questions: result.questions as never,
        duration_sec: result.duration_sec,
        title,
      });
      router.push(`/attempts/${result.attempt.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start quiz");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Quiz Tests" }]} />
      <PageHeader
        mark={<OriginalsMark id="quizzes" size="lg" />}
        title="Quiz Tests"
        subtitle="S1 / S2 / D1 / D2 chapter quizzes, named tests, and the Axiom Prep Discord community."
      />
      <CurriculumPicker value={curr} onChange={setCurr} />
      <ApiStatus error={error} />
      {message ? <p className="mb-4 text-sm text-red-300">{message}</p> : null}

      {curr?.chapterId && loading ? <LoadingBlock /> : null}

      <div className="mb-8 rounded-2xl border border-axiom/40 bg-axiom/10 p-5">
        <p className="font-bold">{discord.data?.title || data?.community_banner?.title || "Join the Axiom Prep Community"}</p>
        <p className="mt-1 text-sm text-zinc-300">
          {discord.data?.description || "Doubt-solving, peer interaction, and direct mentorship on Discord."}
        </p>
        <Link href="/coming-soon" className="btn-primary mt-3 inline-flex h-9 items-center px-4 text-sm">
          Open Discord
        </Link>
      </div>

      <h2 className="mb-3 text-lg font-bold">Tiers</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {(data?.tiers ?? [
          { key: "s1", name: "S1 — Easy Level", purpose: "Foundational JEE Mains/NEET", default_limit: 25, available_tests: 0 },
          { key: "s2", name: "S2 — Tough Level", purpose: "Challenging Mains & toughest NEET", default_limit: 25, available_tests: 0 },
          { key: "d1", name: "D1 — Advanced Easy", purpose: "Entry-level JEE Advanced", default_limit: 25, available_tests: 0 },
          { key: "d2", name: "D2 — Advanced Tough", purpose: "Hardest JEE Advanced tier", default_limit: 25, available_tests: 0 },
        ]).map((tier) => (
          <div key={tier.key} className="surface rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-axiom">{tier.key.toUpperCase()}</p>
            <h3 className="mt-1 text-lg font-bold">{tier.name}</h3>
            <p className="mt-1 text-sm text-zinc-400">{tier.purpose}</p>
            <p className="mt-2 text-xs text-zinc-500">{tier.available_tests} published tests</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={!curr?.chapterId || busy === tier.key}
                onClick={() => void startTier(tier.key)}
                className="btn-primary h-9 px-4 text-sm disabled:opacity-40"
              >
                {busy === tier.key ? "Starting…" : "Start quiz"}
              </button>
              <Link
                href={readerHref({
                  source: "quiz",
                  id: curr?.chapterId || "demo-quiz",
                  title: `${tier.name} booklet`,
                })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-axiom hover:border-axiom"
                aria-label="Open interactive book"
                title="Interactive book"
              >
                📖
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Named quizzes</h2>
      {data?.named_quizzes?.length ? (
        <div className="space-y-3">
          {data.named_quizzes.map((q) => (
            <div key={q.id} className="flex items-center justify-between surface rounded-2xl px-5 py-4">
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="text-sm text-zinc-400">
                  {q.quiz_tier?.toUpperCase()} · {q.question_count} questions · {Math.round(q.duration_sec / 60)} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={readerHref({ source: "quiz", id: q.id, title: q.title })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-axiom hover:border-axiom"
                  aria-label="Open interactive book"
                >
                  📖
                </Link>
                <button
                  type="button"
                  disabled={busy === q.id}
                  onClick={() => void startNamed(q.id, q.title)}
                  className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No named quizzes for this chapter" body="Pick a chapter, then upload a quiz Excel on the admin desk." />
      )}
    </Shell>
  );
}
