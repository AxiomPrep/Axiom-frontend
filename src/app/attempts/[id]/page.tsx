"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { AttemptPayload, loadAttempt } from "@/lib/attempts";
import { submitAttempt } from "@/lib/study-api";
import { Breadcrumbs, EmptyState, PageHeader, Shell } from "@/components/ui";

export default function AttemptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payload, setPayload] = useState<AttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadAttempt(params.id)
      .then((next) => {
        if (!active) return;
        setPayload(next);
        setError(next ? null : "This attempt is not on the API and is not in this browser session.");
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load this attempt.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const question = payload?.questions?.[index];
  const remaining = useMemo(() => {
    if (!payload?.duration_sec) return null;
    return Math.round(payload.duration_sec / 60);
  }, [payload]);

  async function submitAnswer(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    try {
      await api(`/api/attempts/${params.id}/answer`, {
        method: "POST",
        body: JSON.stringify({ question_id: qid, selected_answer: value }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that answer.");
    }
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      await submitAttempt(params.id);
      router.push(`/practice/result?attempt=${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this attempt.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <PageHeader title="Attempt" subtitle="Loading questions from the Axiom Prep API…" />
      </Shell>
    );
  }

  if (!payload) {
    return (
      <Shell>
        <PageHeader title="Attempt" />
        <EmptyState
          title="Attempt session not found"
          body={error || "Start a quiz, custom test, or FST from Originals."}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: payload.title || "Attempt" }]} />
      <PageHeader
        title={payload.title || "Test in progress"}
        subtitle={`${payload.questions.length} questions${remaining ? ` · ${remaining} min` : ""}`}
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      {question ? (
        <div className="surface rounded-2xl p-6">
          <p className="text-sm text-zinc-500">
            Question {index + 1} of {payload.questions.length}
            {question.difficulty ? ` · ${question.difficulty}` : ""}
          </p>
          <p className="mt-3 text-lg font-medium">{question.stem}</p>
          <div className="mt-5 space-y-2">
            {(question.options || ["A", "B", "C", "D"]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => void submitAnswer(question.id, opt)}
                className={`block w-full rounded-xl border px-4 py-3 text-left ${
                  answers[question.id] === opt
                    ? "border-axiom bg-axiom/10"
                    : "border-line hover:border-zinc-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            {index >= payload.questions.length - 1 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void finish()}
                className="btn-primary h-9 px-4 text-sm disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit attempt"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="btn-primary h-9 px-4 text-sm"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : (
        <EmptyState title="This attempt has no questions yet" />
      )}
    </Shell>
  );
}
