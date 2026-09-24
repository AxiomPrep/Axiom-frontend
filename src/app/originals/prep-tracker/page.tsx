"use client";

import { useMemo, useState } from "react";
import { CurriculumPicker, CurriculumValue } from "@/components/CurriculumPicker";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Shell } from "@/components/ui";

type TrackerRow = {
  chapter_id: string;
  title: string;
  class_level: string | null;
  completion_pct: number;
  lectures: { status: string; done: number; total: number };
  practice: { status: string };
  pyqs: { status: string };
  subject?: { name?: string; slug?: string } | null;
};

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "done"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "in_progress"
        ? "bg-axiom/15 text-axiom"
        : "bg-zinc-800 text-zinc-400";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>;
}

export default function PrepTrackerPage() {
  const [curr, setCurr] = useState<CurriculumValue | null>(null);
  const qs = new URLSearchParams();
  if (curr?.subjectId) qs.set("subject_id", curr.subjectId);
  if (curr?.classLevel) qs.set("class", curr.classLevel);
  const { data, error, loading } = useApi<{ tracker: TrackerRow[] }>(
    `/api/originals/prep-tracker${qs.toString() ? `?${qs}` : ""}`
  );
  const rows = data?.tracker ?? [];
  const avg = useMemo(() => {
    if (!rows.length) return 0;
    return Math.round(rows.reduce((s, r) => s + Number(r.completion_pct || 0), 0) / rows.length);
  }, [rows]);

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Prep Tracker" }]} />
      <PageHeader
        mark={<OriginalsMark id="prep-tracker" size="lg" />}
        title="Prep Tracker"
        subtitle="Lecture, practice, and PYQ status by chapter."
      />
      <CurriculumPicker value={curr} onChange={setCurr} hideChapter />
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}

      {!loading && rows.length ? (
        <p className="mb-4 text-sm text-zinc-400">Average completion {avg}%</p>
      ) : null}

      {rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Chapter</th>
                <th className="px-4 py-3 font-medium">Lectures</th>
                <th className="px-4 py-3 font-medium">Practice</th>
                <th className="px-4 py-3 font-medium">PYQs</th>
                <th className="px-4 py-3 font-medium">Done</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.chapter_id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">
                    {row.lectures.done}/{row.lectures.total || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={row.practice.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={row.pyqs.status} />
                  </td>
                  <td className="px-4 py-3 text-axiom">{Number(row.completion_pct || 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <EmptyState title="No tracker rows yet" body="Chapters from the selected subject/class will list here." />
      )}
    </Shell>
  );
}
