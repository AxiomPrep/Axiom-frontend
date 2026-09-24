"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContentItem, formatDuration, Teacher, teacherName } from "@/lib/api";
import { ChapterMark, ChapterMarkId } from "@/components/ChapterMark";
import { CHAPTER_MODULES } from "@/lib/catalog";
import { isPdfModule, readerHref } from "@/lib/reader";
import { useApi } from "@/lib/use-api";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, Shell } from "@/components/ui";

type ChapterResponse = {
  modules: Record<string, ContentItem[]>;
  items: ContentItem[];
};

function ModuleListInner() {
  const params = useParams<{ id: string; chapterId: string; module: string }>();
  const search = useSearchParams();
  const classLevel = search.get("class") || "11";
  const meta = CHAPTER_MODULES.find((m) => m.key === params.module);

  const teacherApi = useApi<{ teacher: Teacher; chapters: { chapter_id: string; title: string }[] }>(
    `/catalog/teachers/${params.id}/modules?class=${classLevel}`
  );
  const chapterApi = useApi<ChapterResponse>(
    `/catalog/teachers/${params.id}/chapters/${params.chapterId}`
  );

  const items = chapterApi.data?.modules?.[params.module] || [];
  const chapterTitle =
    teacherApi.data?.chapters?.find((c) => c.chapter_id === params.chapterId)?.title || "Chapter";
  const teacher = teacherApi.data?.teacher;
  const isPdf = isPdfModule(params.module);

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: "/top-teachers", label: "Top Teachers" },
          {
            href: `/top-teachers/${params.id}/chapters/${params.chapterId}?class=${classLevel}`,
            label: chapterTitle,
          },
          { label: meta?.title || params.module },
        ]}
      />

      <div className="mb-8 flex items-start gap-4">
        {meta ? <ChapterMark id={meta.key as ChapterMarkId} size="lg" /> : null}
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {meta?.title || params.module}
          </h1>
          <p className="mt-2 text-zinc-400">{meta?.subtitle}</p>
        </div>
      </div>

      <ApiStatus error={teacherApi.error || chapterApi.error} />
      {chapterApi.loading ? <LoadingBlock /> : null}

      {!chapterApi.loading && items.length === 0 ? (
        <EmptyState title="Nothing published in this module yet" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const href = isPdf
              ? readerHref({
                  source: "content",
                  id: item.id,
                  title: item.title,
                  url: item.external_url,
                })
              : `/watch/${item.id}?teacher=${params.id}&chapter=${params.chapterId}`;
            return (
              <Link
                key={item.id}
                href={href}
                className="surface surface-hover flex items-center justify-between rounded-2xl px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-500">
                  {formatDuration(item.duration_sec) || (isPdf ? "PDF" : "Open")}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {teacher ? (
        <p className="mt-8 text-sm text-zinc-500">From {teacherName(teacher)}</p>
      ) : null}
    </Shell>
  );
}

export default function ModuleListPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <ModuleListInner />
    </Suspense>
  );
}
