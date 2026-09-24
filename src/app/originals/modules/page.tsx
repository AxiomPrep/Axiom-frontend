"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ModuleAccordion } from "@/components/ModuleAccordion";
import { CurriculumPicker, CurriculumValue } from "@/components/CurriculumPicker";
import { ContentItem } from "@/lib/api";
import { CHAPTER_MODULES } from "@/lib/catalog";
import { readerHref } from "@/lib/reader";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Shell } from "@/components/ui";

type TopModule = {
  id: string;
  title: string;
  description: string | null;
  class_level: string | null;
  content_id: string | null;
  test_id: string | null;
  module?: string | null;
  item?: ContentItem;
  chapters?: { title?: string; class_level?: string } | null;
  subjects?: { title?: string; name?: string; slug?: string } | null;
};

export default function TopModulesPage() {
  const [curr, setCurr] = useState<CurriculumValue | null>(null);
  const qs = new URLSearchParams();
  if (curr?.subjectId) qs.set("subject_id", curr.subjectId);
  if (curr?.classLevel) qs.set("class", curr.classLevel);
  if (curr?.chapterId) qs.set("chapter_id", curr.chapterId);
  const { data, error, loading } = useApi<{ modules: TopModule[] }>(
    `/catalog/originals/modules${qs.toString() ? `?${qs}` : ""}`
  );
  const modules = data?.modules ?? [];

  const grouped = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const key of CHAPTER_MODULES.map((m) => m.key)) map[key] = [];
    for (const mod of modules) {
      const item: ContentItem = mod.item || {
        id: mod.content_id || mod.id,
        title: mod.title,
        description: mod.description || mod.chapters?.title || null,
        type: mod.content_id ? "video" : "note_pdf",
        module: mod.module || "lectures",
        timeline: [],
        duration_sec: null,
        storage_path: null,
        external_url: null,
        sort_order: 0,
        is_free_preview: true,
      };
      const key = item.module && map[item.module] ? item.module : "lectures";
      map[key].push(item);
    }
    return map;
  }, [modules]);

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Top Modules" }]} />
      <PageHeader
        mark={<OriginalsMark id="modules" size="lg" />}
        title="Top Modules"
        subtitle="Subject → Class → Chapter. Same seven-module accordion as Top Teachers."
      />
      <CurriculumPicker value={curr} onChange={setCurr} />
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}

      {curr?.chapterId ? (
        <p className="mb-4 text-sm text-zinc-500">
          Chapter selected. Open lectures below or jump to teacher catalog for full module counts.
        </p>
      ) : null}

      {modules.length ? (
        <ModuleAccordion
          grouped={grouped}
          itemHref={(item) => `/watch/${item.id}`}
        />
      ) : (
        !loading && (
          <EmptyState
            title="No top modules for this filter"
            body="Pick subject, class, and chapter. Uploaded lectures and notes appear in the modules below."
          />
        )
      )}

      {modules.length ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {modules.map((mod) => (
            <div key={mod.id} className="surface rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-axiom">
                {mod.subjects?.name} · Class {mod.class_level || curr?.classLevel}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{mod.title}</h2>
              <div className="mt-3 flex gap-3 text-sm">
                {mod.content_id ? (
                  <Link href={`/watch/${mod.content_id}`} className="font-semibold text-axiom">
                    Open lecture
                  </Link>
                ) : (
                  <Link
                    href={readerHref({ source: "originals", id: mod.id, title: mod.title })}
                    className="font-semibold text-axiom"
                  >
                    Open notes
                  </Link>
                )}
                {mod.test_id ? (
                  <Link href="/originals/top-tests" className="text-zinc-400 hover:text-white">
                    Related test
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
