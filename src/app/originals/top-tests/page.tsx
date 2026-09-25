"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAttempt } from "@/lib/attempts";
import { readerHref } from "@/lib/reader";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, LoadingBlock, PageHeader, Shell } from "@/components/ui";

type Fst = {
  id: string;
  title: string;
  exam_pattern: string | null;
  total_marks: number | null;
  duration_sec: number;
  question_count: number;
};

export default function TopTestsPage() {
  const router = useRouter();
  const { data, error, loading } = useApi<{ headline: string; tests: Fst[]; discussions?: { id: string; title: string; href: string }[] }>(
    "/catalog/originals/top-tests",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const tests = data?.tests ?? [];

  async function start(test: Fst) {
    if (test.id.startsWith("admin_") || test.id.startsWith("mock_")) {
      router.push((test as Fst & { href?: string }).href || `/practice/player?tierName=${encodeURIComponent(test.title)}`);
      return;
    }
    setBusy(test.id);
    setMessage(null);
    try {
      const result = await api<{
        attempt: { id: string };
        questions: unknown[];
        duration_sec?: number;
      }>(`/api/tests/${test.id}/start`, { method: "POST", body: "{}" });
      saveAttempt({
        attempt: result.attempt,
        questions: result.questions as never,
        duration_sec: result.duration_sec,
        title: test.title,
      });
      router.push(`/attempts/${result.attempt.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not start test");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Top Tests / FST" }]} />
      <PageHeader
        mark={<OriginalsMark id="top-tests" size="lg" />}
        title="Top Tests / FST"
        subtitle={
          data?.headline ||
          "Full-fledged mock tests designed strictly on the latest NTA/JAB patterns."
        }
      />
      <ApiStatus error={error} />
      {message ? <p className="mb-4 text-sm text-red-300">{message}</p> : null}
      {loading ? <LoadingBlock /> : null}
      <div className="space-y-3">
        {(tests.length ? tests : []).map((test) => (
            <div
              key={test.id}
              className="flex flex-wrap items-center justify-between gap-3 surface rounded-2xl px-5 py-4"
            >
              <div>
                <p className="font-semibold">{test.title}</p>
                <p className="text-sm text-zinc-400">
                  {(test.exam_pattern || "pattern").replaceAll("_", " ").toUpperCase()} ·{" "}
                  {test.total_marks ?? "—"} marks · {Math.round(test.duration_sec / 60)} min ·{" "}
                  {test.question_count} questions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={readerHref({ source: "test", id: test.id, title: test.title })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-axiom"
                  aria-label="Open interactive book"
                >
                  📖
                </Link>
                <button
                  type="button"
                  disabled={busy === test.id || test.question_count === 0}
                  onClick={() => void start(test)}
                  className="btn-primary h-9 px-4 text-sm disabled:opacity-40"
                >
                  {test.question_count === 0
                    ? "Bank filling"
                    : busy === test.id
                      ? "Starting…"
                      : "Start FST"}
                </button>
              </div>
            </div>
          ))}
        {!loading
          ? Array.from({ length: Math.max(0, 25 - tests.length) }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className="rounded-2xl border border-dashed border-line px-5 py-4 text-sm text-zinc-600"
              >
                FST {tests.length + i + 1} of 25 — slot reserved
              </div>
            ))
          : null}
      </div>
      {data?.discussions?.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Paper discussions</h2>
          <div className="space-y-2">
            {data.discussions.map((item) => (
              <Link key={item.id} href={item.href} className="surface surface-hover block rounded-2xl px-5 py-4">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
