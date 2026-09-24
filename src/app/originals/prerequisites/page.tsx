"use client";

import { useState } from "react";
import { CurriculumPicker, CurriculumValue } from "@/components/CurriculumPicker";
import type { AdminContent } from "@/lib/admin";
import { DeskRail } from "@/components/DeskRail";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Shell } from "@/components/ui";

type SeqItem = {
  sort_order: number;
  chapter: { id: string; title: string; class_level: string | null };
};

export default function PrerequisitesPage() {
  const [curr, setCurr] = useState<CurriculumValue | null>(null);
  const { data, error, loading } = useApi<{
    target: { id: string; title: string; class_level: string | null };
    message: string;
    sequence: SeqItem[];
    desk?: AdminContent[];
  }>(curr?.chapterId ? `/catalog/originals/prerequisites/${curr.chapterId}` : null);

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Prerequisite Mapping" }]} />
      <PageHeader
        mark={<OriginalsMark id="prerequisites" size="lg" />}
        title="Prerequisite Mapping"
        subtitle="Ensure your basics are strong before diving into complex chapters."
      />
      <CurriculumPicker value={curr} onChange={setCurr} />
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}

      {data ? (
        <div>
          <p className="mb-6 text-zinc-400">{data.message}</p>
          <div className="space-y-3">
            {data.sequence.map((step, i) => {
              const isTarget = step.chapter.id === data.target.id;
              return (
                <div
                  key={`${step.chapter.id}-${i}`}
                  className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
                    isTarget ? "border-axiom bg-axiom/10" : "border-line bg-card"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.chapter.title}</p>
                    <p className="text-xs text-zinc-400">
                      {isTarget ? "Target chapter" : "Prerequisite"}
                      {step.chapter.class_level ? ` · Class ${step.chapter.class_level}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <DeskRail items={data.desk || []} title="Uploaded map" />
        </div>
      ) : (
        !loading && <EmptyState title="Pick a chapter" body="Pick a chapter to see its prerequisite path, plus any uploaded map." />
      )}
    </Shell>
  );
}
