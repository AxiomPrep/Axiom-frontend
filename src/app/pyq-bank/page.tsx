"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { ApiStatus, Breadcrumbs, PageHeader, Pill, Shell } from "@/components/ui";

const FILTERS = [
  ["all", "All exams"],
  ["mains", "JEE Main"],
  ["neet", "NEET UG"],
  ["adv", "JEE Advanced"],
] as const;

type PyqSubject = {
  id: string;
  slug: string;
  name: string;
  totalQuestions: number;
  class11Count: number;
  class12Count: number;
};

type PyqChapter = {
  id: string;
  name: string;
  jeeCount: number;
  neetCount: number;
  advCount: number;
};

type PyqExam = {
  id: string;
  examName: string;
  year: string;
  shift: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: string;
  subject: string;
  classNum: string;
  chapter: string;
  href?: string;
  read_url?: string | null;
};

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function PYQBankContent() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<PyqSubject[]>([]);
  const [chapters, setChapters] = useState<PyqChapter[]>([]);
  const [exams, setExams] = useState<PyqExam[]>([]);
  const [loadError, setLoadError] = useState<ApiClientError | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("physics");
  const [selectedClass, setSelectedClass] = useState<"11" | "12" | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [examTypeFilter, setExamTypeFilter] = useState<(typeof FILTERS)[number][0]>("all");

  useEffect(() => {
    void api<{ subjects?: Array<Record<string, unknown>> }>("/catalog/pyq/subjects")
      .then((data) => {
        const next = (data.subjects || []).map((subject) => ({
          id: String(subject.slug || subject.id || ""),
          slug: String(subject.slug || subject.id || ""),
          name: String(subject.name || "Subject"),
          totalQuestions: num(subject.total_questions ?? subject.question_count),
          class11Count: num(subject.class_11_count),
          class12Count: num(subject.class_12_count),
        }));
        setSubjects(next);
        if (next[0]) setSelectedSubjectId(next[0].slug);
      })
      .catch((err: unknown) => {
        setSubjects([]);
        setLoadError(
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, "error", err instanceof Error ? err.message : "Could not load PYQs."),
        );
      });
  }, []);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

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

  useEffect(() => {
    const query = new URLSearchParams();
    if (currentSubject?.slug) query.set("subject", currentSubject.slug);
    if (selectedClass) query.set("class", selectedClass);
    if (selectedChapterId) query.set("chapter_id", selectedChapterId);
    void api<{ exams?: Array<Record<string, unknown>> }>(`/catalog/pyq/exams?${query}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.exams || [];
        setExams(
          (list as Array<Record<string, unknown>>).map((exam) => ({
            id: String(exam.id),
            examName: String(exam.exam_name || exam.name || exam.title || "Exam"),
            year: String(exam.year || ""),
            shift: String(exam.shift || ""),
            durationMinutes: num(exam.duration_minutes || exam.duration),
            questionCount: num(exam.question_count),
            difficulty: String(exam.difficulty || ""),
            subject: String(exam.subject || currentSubject?.slug || ""),
            classNum: String(exam.class || exam.class_level || selectedClass || ""),
            chapter: String(exam.chapter_id || exam.chapter || selectedChapterId || ""),
            href: typeof exam.href === "string" ? exam.href : undefined,
            read_url: typeof exam.read_url === "string" ? exam.read_url : null,
          })),
        );
      })
      .catch((err: unknown) => {
        setExams([]);
        setLoadError(
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, "error", err instanceof Error ? err.message : "Could not load exams."),
        );
      });
  }, [currentSubject, selectedClass, selectedChapterId]);

  const chaptersForSubject = chapters;
  const currentChapter = chapters.find((c) => c.id === selectedChapterId);

  const filteredExamSets = exams.filter((set) => {
    if (examTypeFilter === "mains" && !set.examName.includes("JEE Main")) return false;
    if (examTypeFilter === "neet" && !set.examName.includes("NEET")) return false;
    if (examTypeFilter === "adv" && !set.examName.includes("JEE Advanced")) return false;
    return true;
  });

  const startExam = (set: PyqExam) => {
    if (set.href) {
      router.push(set.href);
      return;
    }
    router.push(`/practice/player?subject=${set.subject}&class=${set.classNum}&chapter=${set.chapter}&pyq=${set.id}`);
  };

  const openReader = (set: PyqExam) => {
    if (set.href) {
      router.push(set.href);
      return;
    }
    router.push(`/reader?type=pyq&set=${set.id}`);
  };

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/pyq-bank", label: "PYQs" },
          ...(selectedClass ? [{ label: `Class ${selectedClass}` }] : []),
          ...(currentChapter ? [{ label: currentChapter.name }] : []),
        ]}
      />
        <PageHeader
          eyebrow="Previous year questions"
          title="Official papers, 2015 to 2024."
          subtitle="NTA and IIT archives arranged by subject, class, and chapter. Open a paper in the reader, or sit it as a timed set."
        />
        <ApiStatus error={loadError} />

      <section>
        <p className="mb-4 font-display text-lg italic text-axiom">Step 1 — Subject</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {subjects.map((sub) => {
            const selected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedChapterId(null);
                }}
                className={`surface surface-hover rounded-2xl p-5 text-left ${selected ? "ring-2 ring-axiom" : ""}`}
              >
                <h2 className="font-display text-2xl font-semibold text-ink">{sub.name}</h2>
                <p className="mt-2 text-sm text-muted">{sub.totalQuestions.toLocaleString()} PYQs</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <p className="mb-4 font-display text-lg italic text-axiom">Step 2 — Class</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSelectedClass("11");
              setSelectedChapterId(null);
            }}
            className={`surface surface-hover rounded-2xl p-6 text-left ${selectedClass === "11" ? "ring-2 ring-axiom" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-3xl font-semibold text-ink">Class XI</h3>
              <span className="text-sm text-axiom">{(currentSubject?.class11Count ?? 0).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Kinematics, thermodynamics, mole concept, quadratic equations.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedClass("12");
              setSelectedChapterId(null);
            }}
            className={`surface surface-hover rounded-2xl p-6 text-left ${selectedClass === "12" ? "ring-2 ring-axiom" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-3xl font-semibold text-ink">Class XII</h3>
              <span className="text-sm text-axiom">{(currentSubject?.class12Count ?? 0).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Electrodynamics, optics, calculus, coordination chemistry, genetics.</p>
          </button>
        </div>
      </section>

      {selectedClass ? (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <p className="font-display text-lg italic text-axiom">Step 3 — Chapter</p>
            <span className="text-xs text-muted">{chaptersForSubject.length} chapters</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chaptersForSubject.map((ch) => {
              const selected = ch.id === selectedChapterId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`surface surface-hover rounded-2xl p-4 text-left ${selected ? "ring-2 ring-axiom" : ""}`}
                >
                  <h3 className="font-display text-lg font-semibold leading-tight text-ink">{ch.name}</h3>
                  <p className="mt-2 text-xs text-muted">
                    Mains {ch.jeeCount} · NEET {ch.neetCount} · Adv {ch.advCount}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="surface mt-12 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-line/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg italic text-axiom">Step 4 — Exam set</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink">Papers and shifts</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([key, label]) => (
              <Pill key={key} active={examTypeFilter === key} onClick={() => setExamTypeFilter(key)}>
                {label}
              </Pill>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {filteredExamSets.map((examSet) => (
            <div
              key={examSet.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-semibold text-ink">{examSet.examName}</h3>
                  <span className="text-sm italic text-axiom">{examSet.year}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {examSet.shift} · {examSet.durationMinutes} min · {examSet.questionCount} questions · {examSet.difficulty}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openReader(examSet)}
                  className="btn-ghost h-10 px-4 text-sm"
                >
                  Reader
                </button>
                <button type="button" onClick={() => startExam(examSet)} className="btn-primary h-10 px-4 text-sm">
                  Open set
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export default function PYQBankPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-sm text-muted">Loading PYQ bank…</p>
        </Shell>
      }
    >
      <PYQBankContent />
    </Suspense>
  );
}
