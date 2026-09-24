"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CurriculumPicker, CurriculumValue } from "@/components/CurriculumPicker";
import type { AdminContent } from "@/lib/admin";
import { DeskRail } from "@/components/DeskRail";
import { api } from "@/lib/api";
import { saveAttempt } from "@/lib/attempts";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, PageHeader, Pill, Shell } from "@/components/ui";
import { ApiClientError } from "@/lib/api";
import { useApi } from "@/lib/use-api";

const FORMATS = ["scq", "mcq", "numerical"] as const;

export default function CustomTestPage() {
  const router = useRouter();
  const [curr, setCurr] = useState<CurriculumValue | null>(null);
  const [total, setTotal] = useState(20);
  const [formats, setFormats] = useState<string[]>(["scq", "mcq", "numerical"]);
  const [easy, setEasy] = useState(35);
  const [medium, setMedium] = useState(40);
  const [hard, setHard] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [resultNote, setResultNote] = useState<string | null>(null);
  const deskApi = useApi<{ contents: AdminContent[] }>(
    curr
      ? `/catalog/desk?destination=originals-custom-test&subject=${curr.slug}&class=${curr.classLevel}&chapter=${curr.chapterId}`
      : "/catalog/desk?destination=originals-custom-test",
  );

  function toggleFormat(fmt: string) {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((x) => x !== fmt) : [...prev, fmt]
    );
  }

  async function generate() {
    if (!curr?.chapterId && !curr?.subjectId) return;
    setBusy(true);
    setError(null);
    setResultNote(null);
    try {
      const result = await api<{
        attempt: { id: string };
        test: { title?: string; duration_sec?: number; question_ids?: string[] };
        questions: unknown[];
        difficulty_split: { easy: string; medium: string; hard: string };
      }>("/api/originals/custom-test", {
        method: "POST",
        body: JSON.stringify({
          chapter_id: curr.chapterId || undefined,
          subject_id: curr.subjectId || undefined,
          class_level: curr.classLevel,
          total_questions: total,
          formats,
          difficulty_split: {
            easy: easy / 100,
            medium: medium / 100,
            hard: hard / 100,
          },
        }),
      });
      saveAttempt({
        attempt: result.attempt,
        questions: result.questions as never,
        duration_sec: result.test?.duration_sec,
        title: result.test?.title || "Custom Guidance Test",
      });
      setResultNote(
        `Generated ${result.questions.length} questions (${result.difficulty_split.easy} easy / ${result.difficulty_split.medium} medium / ${result.difficulty_split.hard} hard).`
      );
      router.push(`/attempts/${result.attempt.id}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err
          : new ApiClientError(500, "error", err instanceof Error ? err.message : "Failed")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Guidance Test Builder" }]} />
      <PageHeader
        mark={<OriginalsMark id="custom-test" size="lg" />}
        title="Level-Based Guidance Test"
        subtitle="Choose chapter, question count, formats, and difficulty mix. The API builds an attempt immediately."
      />
      <CurriculumPicker value={curr} onChange={setCurr} />
      <ApiStatus error={error} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="surface rounded-2xl p-6">
          <label className="text-sm font-semibold">Total questions: {total}</label>
          <input
            type="range"
            min={10}
            max={50}
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            className="mt-3 w-full"
          />
          <p className="mt-6 text-sm font-semibold">Formats</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FORMATS.map((fmt) => (
              <Pill key={fmt} active={formats.includes(fmt)} onClick={() => toggleFormat(fmt)}>
                {fmt.toUpperCase()}
              </Pill>
            ))}
          </div>
        </div>
        <div className="surface rounded-2xl p-6 space-y-4">
          <Split label="Easy" value={easy} onChange={setEasy} />
          <Split label="Medium" value={medium} onChange={setMedium} />
          <Split label="Hard" value={hard} onChange={setHard} />
        </div>
      </div>

      <button
        type="button"
        disabled={busy || formats.length === 0 || (!curr?.chapterId && !curr?.subjectId)}
        onClick={() => void generate()}
        className="btn-primary mt-8 h-11 px-6 text-sm disabled:opacity-40"
      >
        {busy ? "Generating…" : "Generate test & start player"}
      </button>
      {resultNote ? <p className="mt-3 text-sm text-zinc-400">{resultNote}</p> : null}
      <DeskRail items={deskApi.data?.contents || []} title="Uploaded question banks" />
    </Shell>
  );
}

function Split({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-zinc-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
    </div>
  );
}
