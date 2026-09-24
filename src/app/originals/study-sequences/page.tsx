"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, LoadingBlock, PageHeader, Shell } from "@/components/ui";

type Sequence = {
  id: string;
  slug: string;
  title: string;
  goal_key: string;
  description: string | null;
  steps: { step?: number; action?: string }[] | unknown;
  href?: string;
};

const FALLBACK: Sequence[] = [
  {
    id: "goal-air",
    slug: "air-1000",
    title: "AIR under 1000",
    goal_key: "rank",
    description: "A long-horizon path: finish lectures, then mixed PYQs, then full syllabus tests.",
    steps: [
      { step: 1, action: "Close every chapter lecture + notes PDF" },
      { step: 2, action: "S1 then S2 quizzes until accuracy holds" },
      { step: 3, action: "Weekly FST; log misses in Improvement Book" },
    ],
  },
  {
    id: "goal-mains",
    slug: "mains-95",
    title: "95 percentile JEE Mains",
    goal_key: "mains",
    description: "Speed and coverage over depth. One-shots, then Mains PYQs, then timed S2.",
    steps: [
      { step: 1, action: "One-shots for remaining chapters" },
      { step: 2, action: "10 Mains PYQs after each lecture" },
      { step: 3, action: "Two custom tests per week at 25–40 Q" },
    ],
  },
  {
    id: "goal-neet",
    slug: "neet-650",
    title: "NEET 650+",
    goal_key: "neet",
    description: "NCERT first, then NEET PYQ bridge, then biology diagrams from Originals tools.",
    steps: [
      { step: 1, action: "NCERT shelf with highlights for Bio + Chem" },
      { step: 2, action: "NEET 10 after every lecture" },
      { step: 3, action: "Diagram + formula sheets before sleep" },
    ],
  },
  {
    id: "goal-crunch",
    slug: "two-month",
    title: "Two-month crunch",
    goal_key: "sprint",
    description: "Revision series, important PDFs, and FSTs only — no new long lectures.",
    steps: [
      { step: 1, action: "Revision series + important PDFs per chapter" },
      { step: 2, action: "Daily timer blocks by subject" },
      { step: 3, action: "FST every Sunday; Improvement Book every night" },
    ],
  },
];

export default function StudySequencesPage() {
  const { data, error, loading } = useApi<{ sequences: Sequence[] }>("/catalog/originals/study-sequences");
  const live = data?.sequences ?? [];
  const sequences = live.length ? live.slice(0, 4) : FALLBACK;

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Study Sequences" }]} />
      <PageHeader
        mark={<OriginalsMark id="study-sequences" size="lg" />}
        title="Study Sequences"
        subtitle="Four goal cards: rank, Mains percentile, NEET score, or a two-month sprint."
      />
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {sequences.map((seq) => {
          const steps = Array.isArray(seq.steps) ? seq.steps : [];
          return (
            <div key={seq.id} className="surface surface-hover flex min-h-[280px] flex-col rounded-2xl p-6">
              {seq.href ? (
                <Link href={seq.href} className="mb-2 text-xs font-semibold text-axiom">
                  Open upload
                </Link>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">{seq.goal_key}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">{seq.title}</h2>
              {seq.description ? <p className="mt-2 flex-1 text-sm text-zinc-400">{seq.description}</p> : null}
              <ol className="mt-4 space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-200">
                    <span className="font-bold text-axiom">{(step as { step?: number }).step || i + 1}.</span>
                    <span>{(step as { action?: string }).action || String(step)}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
