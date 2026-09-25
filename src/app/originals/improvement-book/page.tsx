"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Pill, Shell } from "@/components/ui";

type Mistake = {
  id: string;
  source: string;
  selected_answer: string | null;
  answered_at: string | null;
  questions?: {
    stem?: string;
    difficulty?: string;
    exam?: string;
    explanation?: string | null;
    correct_answer?: string;
  } | null;
};

type BookResponse = {
  mistakes: Mistake[];
  by_source: {
    test_mistakes: Mistake[];
    quiz_test_mistakes: Mistake[];
    module_mistakes: Mistake[];
    practice_mistakes: Mistake[];
    pyq_mistakes: Mistake[];
  };
  total: number;
};

const TABS = [
  { key: "", label: "All" },
  { key: "test", label: "Tests" },
  { key: "quiz", label: "Quizzes" },
  { key: "module", label: "Modules" },
  { key: "practice", label: "Practice" },
  { key: "pyq", label: "PYQs" },
] as const;

export default function ImprovementBookPage() {
  const [source, setSource] = useState("");
  const { data, error, loading } = useApi<BookResponse>(
    source ? `/catalog/originals/improvement-book?source=${source}` : "/catalog/originals/improvement-book"
  );
  const mistakes = data?.mistakes ?? [];

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Improvement Book" }]} />
      <PageHeader
        mark={<OriginalsMark id="improvement-book" size="lg" />}
        title="Improvement Book"
        subtitle="Every incorrect attempt, grouped by test, quiz, module, practice, and PYQ."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Pill key={tab.key} active={source === tab.key} onClick={() => setSource(tab.key)}>
            {tab.label}
          </Pill>
        ))}
      </div>
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}
      {!loading && (
        <p className="mb-4 text-sm text-zinc-500">{data?.total ?? 0} mistake{(data?.total ?? 0) === 1 ? "" : "s"}</p>
      )}
      {mistakes.length ? (
        <div className="space-y-3">
          {mistakes.map((row) => {
            const q = Array.isArray(row.questions) ? row.questions[0] : row.questions;
            return (
              <div key={row.id} className="surface rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-axiom">{row.source}</p>
                <p className="mt-2 font-medium">{q?.stem || "Question unavailable"}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Your answer: {row.selected_answer || "—"}
                  {q?.correct_answer ? ` · Correct: ${q.correct_answer}` : ""}
                </p>
                {q?.explanation ? <p className="mt-2 text-sm text-zinc-300">{q.explanation}</p> : null}
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <EmptyState
            title="No mistakes recorded yet"
            body="Wrong answers from practice, PYQs, quizzes, and tests appear here."
          />
        )
      )}
    </Shell>
  );
}
