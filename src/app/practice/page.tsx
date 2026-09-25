"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { AdminContent } from "@/lib/admin";
import { DeskRail } from "@/components/DeskRail";
import { ApiStatus, PageHeader, Shell } from "@/components/ui";

type PracticeSubject = {
  id: string;
  slug: string;
  name: string;
  formula: string;
  tagline: string;
  totalQuestions: number;
  class11Count: number;
  class12Count: number;
};

type PracticeChapter = {
  id: string;
  name: string;
  highYield?: boolean;
  completedCount: number;
  totalCount: number;
  jeeCount: number;
  neetCount: number;
  advCount: number;
};

type PracticeTierCard = {
  tier: number;
  badge: string;
  name: string;
  subtitle: string;
  questionCount: number;
  difficulty: string;
  description: string;
  timePerQuestion: string;
};

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [chapters, setChapters] = useState<PracticeChapter[]>([]);
  const [tiers, setTiers] = useState<PracticeTierCard[]>([]);
  const [loadError, setLoadError] = useState<ApiClientError | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(searchParams.get("subject"));
  const [selectedClass, setSelectedClass] = useState<"11" | "12" | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [desk, setDesk] = useState<AdminContent[]>([]);

  useEffect(() => {
    void api<{ subjects?: Array<Record<string, unknown>> }>("/catalog/practice/subjects")
      .then((data) => {
        setSubjects(
          (data.subjects || []).map((subject) => ({
            id: String(subject.id || subject.slug || ""),
            slug: String(subject.slug || subject.id || ""),
            name: String(subject.name || "Subject"),
            formula: String(subject.formula || ""),
            tagline: String(subject.tagline || subject.description || ""),
            totalQuestions: num(subject.total_questions ?? subject.question_count),
            class11Count: num(subject.class_11_count ?? subject.class11_count),
            class12Count: num(subject.class_12_count ?? subject.class12_count),
          })),
        );
      })
      .catch((err: unknown) => {
        setSubjects([]);
        setLoadError(
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, "error", err instanceof Error ? err.message : "Could not load practice."),
        );
      });
  }, []);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId || s.slug === selectedSubjectId);

  useEffect(() => {
    if (!currentSubject || !selectedClass) return;
    void api<{ chapters?: Array<Record<string, unknown>> }>(
      `/catalog/practice/subjects/${currentSubject.slug}/classes/${selectedClass}/chapters`,
    )
      .then((data) => {
        setChapters(
          (data.chapters || []).map((chapter) => ({
            id: String(chapter.id),
            name: String(chapter.title || chapter.name || "Chapter"),
            highYield: Boolean(chapter.high_yield || chapter.highYield),
            completedCount: num(chapter.completed_count),
            totalCount: num(chapter.total_count || chapter.question_count),
            jeeCount: num(chapter.jee_count),
            neetCount: num(chapter.neet_count),
            advCount: num(chapter.adv_count),
          })),
        );
      })
      .catch((err: unknown) => {
        setChapters([]);
        setLoadError(
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, "error", err instanceof Error ? err.message : "Could not load chapters."),
        );
      });
  }, [currentSubject, selectedClass]);

  const chaptersForSubject = chapters.filter((chapter) =>
    searchQuery.trim() ? chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
  );
  const currentChapter = chapters.find((c) => c.id === selectedChapterId);

  useEffect(() => {
    if (!currentChapter) return;
    const query = new URLSearchParams({
      subject: currentSubject?.slug || "",
      class: selectedClass || "",
      chapter_id: currentChapter.id,
    });
    void api<{ tiers?: Array<Record<string, unknown>> }>(`/catalog/practice/tiers?${query}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.tiers || [];
        setTiers(
          (list as Array<Record<string, unknown>>).map((item, index) => ({
            tier: num(item.tier || item.level || index + 1),
            badge: String(item.badge || `Tier ${item.tier || index + 1}`),
            name: String(item.name || item.title || `Tier ${index + 1}`),
            subtitle: String(item.subtitle || ""),
            questionCount: num(item.question_count || item.questions),
            difficulty: String(item.difficulty || ""),
            description: String(item.description || ""),
            timePerQuestion: String(item.time_per_question || item.time || ""),
          })),
        );
        setDesk(Array.isArray((data as { desk?: AdminContent[] }).desk) ? (data as { desk: AdminContent[] }).desk : []);
      })
      .catch((err: unknown) => {
        setTiers([]);
        setLoadError(
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, "error", err instanceof Error ? err.message : "Could not load tiers."),
        );
      });
  }, [currentChapter, currentSubject, selectedClass]);

  const tier = tiers.find((item) => item.tier === selectedTier) || tiers[0];

  const reset = () => {
    setSelectedSubjectId(null);
    setSelectedClass(null);
    setSelectedChapterId(null);
    setSelectedTier(1);
    setSearchQuery("");
    setChapters([]);
    setTiers([]);
  };

  const startPractice = () => {
    const chapterId = selectedChapterId || chaptersForSubject[0]?.id;
    if (!currentSubject || !chapterId) return;
    void api<{ id?: string; attempt?: { id?: string } }>("/api/practice/attempt", {
      method: "POST",
      body: JSON.stringify({
        subject: currentSubject.slug,
        subject_id: currentSubject.id,
        class: selectedClass || "11",
        class_level: selectedClass || "11",
        chapter_id: chapterId,
        tier: selectedTier,
      }),
    })
      .then((created) => {
        const attemptId = created.attempt?.id || created.id;
        const query = new URLSearchParams({
          subject: currentSubject.slug,
          class: selectedClass || "11",
          chapter: chapterId,
          tier: String(selectedTier),
        });
        if (attemptId) query.set("attempt", attemptId);
        query.set("subjectName", currentSubject.name);
        query.set("chapterName", currentChapter?.name || "");
        query.set("tierName", tier?.name || `Tier ${selectedTier}`);
        router.push(`/practice/player?${query}`);
      })
      .catch(() => {
        const query = new URLSearchParams({
          subject: currentSubject.slug,
          class: selectedClass || "11",
          chapter: chapterId,
          tier: String(selectedTier),
          subjectName: currentSubject.name,
          chapterName: currentChapter?.name || "",
          tierName: tier?.name || `Tier ${selectedTier}`,
        });
        router.push(`/practice/player?${query}`);
      });
  };

  const openReader = (tierId: number) => {
    router.push(
      `/reader?type=practice&subject=${selectedSubjectId}&class=${selectedClass || "11"}&chapter=${selectedChapterId || ""}&tier=${tierId}`,
    );
  };

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Practice"
          title="Build precision, one tier at a time."
          subtitle="Choose a subject, class, and chapter, then work a five-tier set — from NCERT fundamentals through Advanced and Olympiad."
        />
        {selectedSubjectId ? (
          <button type="button" onClick={reset} className="btn-ghost mb-10 h-10 shrink-0 px-4 text-sm">
            Start over
          </button>
        ) : null}
      </div>

        <ApiStatus error={loadError} />
      <section>
        <p className="mb-4 font-display text-lg italic text-axiom">Step 1 — Subject</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((sub) => {
            const selected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedClass(null);
                  setSelectedChapterId(null);
                }}
                className={`surface surface-hover rounded-2xl p-6 text-left ${selected ? "ring-2 ring-axiom" : ""}`}
              >
                <p className="font-display text-lg italic text-axiom">{sub.formula}</p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-ink">{sub.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{sub.tagline}</p>
                <p className="mt-4 text-xs tracking-wide text-muted">{sub.totalQuestions.toLocaleString()} questions</p>
              </button>
            );
          })}
        </div>
      </section>

      {currentSubject ? (
        <section className="mt-12">
          <p className="mb-4 font-display text-lg italic text-axiom">Step 2 — Class</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["11", "12"] as const).map((cls) => {
              const selected = selectedClass === cls;
              const count = cls === "11" ? currentSubject.class11Count : currentSubject.class12Count;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setSelectedClass(cls);
                    setSelectedChapterId(null);
                  }}
                  className={`surface surface-hover rounded-2xl p-6 text-left ${selected ? "ring-2 ring-axiom" : ""}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">
                    Class {cls === "11" ? "XI" : "XII"}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
                    {cls === "11" ? "Class XI" : "Class XII"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {cls === "11"
                      ? "Kinematics, Laws of Motion, Thermodynamics, Bonding, Mole Concept, Algebra and Functions."
                      : "Electrostatics, Optics, Modern Physics, Calculus, Coordination Chemistry, Genetics."}
                  </p>
                  <p className="mt-4 text-sm text-muted">
                    {count.toLocaleString()} questions · JEE · NEET · JEE Advanced
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedClass ? (
        <section className="mt-12">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="font-display text-lg italic text-axiom">Step 3 — Chapter</p>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters"
              className="h-10 w-full rounded-full border border-line bg-card px-4 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none sm:w-64"
            />
          </div>
          <div className="space-y-3">
            {chaptersForSubject.map((ch) => {
              const selected = ch.id === selectedChapterId;
              const pct = ch.totalCount > 0 ? Math.round((ch.completedCount / ch.totalCount) * 100) : 0;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`surface surface-hover flex w-full flex-col gap-3 rounded-2xl p-5 text-left sm:flex-row sm:items-center sm:justify-between ${
                    selected ? "ring-2 ring-axiom" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-ink">{ch.name}</h3>
                      {ch.highYield ? (
                        <span className="rounded-full border border-axiom/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-axiom">
                          High yield
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 h-1 max-w-xs overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-axiom" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    {ch.jeeCount > 0 ? <span className="rounded-full border border-line px-2.5 py-1">JEE {ch.jeeCount}</span> : null}
                    {ch.neetCount > 0 ? <span className="rounded-full border border-line px-2.5 py-1">NEET {ch.neetCount}</span> : null}
                    {ch.advCount > 0 ? <span className="rounded-full border border-line px-2.5 py-1">Adv {ch.advCount}</span> : null}
                  </div>
                </button>
              );
            })}
            {chaptersForSubject.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-axiom/20 px-6 py-12 text-center text-sm text-zinc-500">
                No chapters match “{searchQuery}”.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {currentChapter ? (
        <section className="surface mt-12 rounded-3xl p-6 sm:p-8">
          <p className="font-display text-lg italic text-axiom">Step 4 — Tier</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Structured tier progression</h2>
          <p className="mt-2 text-sm text-muted">
            {currentChapter.name} · Class {selectedClass}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {tiers.map((item) => {
              const selected = selectedTier === item.tier;
              return (
                <div
                  key={item.tier}
                  onClick={() => setSelectedTier(item.tier)}
                  className={`flex h-full cursor-pointer flex-col rounded-2xl border p-4 text-left transition ${
                    selected ? "border-axiom bg-axiom/10" : "border-line bg-white/[0.02] hover:border-axiom/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${selected ? "bg-axiom text-black" : "text-axiom"}`}>
                      {item.badge}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReader(item.tier);
                      }}
                      className="text-[11px] font-semibold text-axiom hover:text-axiom-hover"
                    >
                      Read
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] text-muted">{item.timePerQuestion} / question</p>
                  <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-ink">{item.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
                  <p className="mt-4 text-xs text-muted">
                    {item.questionCount} questions · {item.difficulty}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-line/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-ink">
                Tier {selectedTier}: {tier?.name}
              </span>
              <span className="mt-1 block text-xs text-muted sm:ml-2 sm:mt-0 sm:inline">
                {tier?.questionCount} questions · {tier?.timePerQuestion} each · {tier?.description}
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => openReader(selectedTier)} className="btn-ghost h-11 px-5 text-sm">
                Annotate reader
              </button>
              <button type="button" onClick={startPractice} className="btn-primary h-11 px-6 text-sm">
                Start practice session
              </button>
            </div>
          </div>
          <DeskRail
            items={desk.filter((item) => !item.tier || String(item.tier) === String(selectedTier))}
            title="Uploaded for this chapter"
          />
        </section>
      ) : null}
    </Shell>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-sm text-muted">Loading practice…</p>
        </Shell>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
