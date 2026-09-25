"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContentItem, Teacher, teacherName, teacherSubject } from "@/lib/api";
import { findFacultyTeacher, isOpaqueChapterLabel, teacherFromFaculty } from "@/lib/faculty-catalog";
import { useApi } from "@/lib/use-api";
import { ModuleAccordion } from "@/components/ModuleAccordion";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, Shell } from "@/components/ui";

type ChapterResponse = {
  teacher_id: string;
  chapter_id: string;
  modules: Record<string, ContentItem[]>;
  items: ContentItem[];
};

function ChapterModulesInner() {
  const params = useParams<{ id: string; chapterId: string }>();
  const search = useSearchParams();
  const classLevel = search.get("class") || "11";
  const teacherPath = `/catalog/teachers/${params.id}/modules?class=${classLevel}`;
  const chapterPath = `/catalog/teachers/${params.id}/chapters/${params.chapterId}`;

  const teacherApi = useApi<{ teacher: Teacher; chapters: { chapter_id: string; title: string }[] }>(
    teacherPath
  );
  const chapterApi = useApi<ChapterResponse>(chapterPath);

  const fallback = findFacultyTeacher(params.id);
  const teacher = teacherApi.data?.teacher || (fallback ? teacherFromFaculty(fallback) : undefined);
  const chapterTitle = (() => {
    const raw = teacherApi.data?.chapters?.find((c) => c.chapter_id === params.chapterId)?.title || "";
    return raw && !isOpaqueChapterLabel(raw) ? raw : "Chapter";
  })();
  const grouped = chapterApi.data?.modules || {};
  const items = chapterApi.data?.items || [];

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: "/top-teachers", label: "Top Teachers" },
          { href: `/top-teachers/${params.id}`, label: teacher ? teacherSubject(teacher) : "Subject" },
          { href: `/top-teachers/${params.id}?class=${classLevel}`, label: teacher ? teacherName(teacher) : "Teacher" },
          { label: `Class ${classLevel}` },
          { label: chapterTitle },
        ]}
      />

      <ApiStatus error={teacherApi.error || chapterApi.error} />
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{chapterTitle}</h1>
      <p className="mt-2 mb-8 text-zinc-400">Seven modules — lectures through important PDFs.</p>

      {chapterApi.loading && !items.length ? <LoadingBlock label="Loading modules…" /> : null}

      <ModuleAccordion
        grouped={grouped}
        itemHref={(item) =>
          `/watch/${item.id}?teacher=${params.id}&chapter=${params.chapterId}`
        }
      />

      {!chapterApi.loading && items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No published items in this chapter yet"
            body="The 7-module grid is ready. Content appears as lectures and PDFs are published."
          />
        </div>
      ) : null}
    </Shell>
  );
}

export default function ChapterModulesPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <ChapterModulesInner />
    </Suspense>
  );
}
