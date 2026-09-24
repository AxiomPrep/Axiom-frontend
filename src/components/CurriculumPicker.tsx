"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Pill } from "@/components/ui";

type Subject = { id: string; name: string; slug: string };
type Chapter = { id: string; title: string };

export type CurriculumValue = {
  subjectId: string;
  slug: string;
  classLevel: "11" | "12";
  chapterId: string;
  chapterTitle: string;
};

export function CurriculumPicker({
  value,
  onChange,
  hideChapter = false,
}: {
  value: CurriculumValue | null;
  onChange: (next: CurriculumValue) => void;
  hideChapter?: boolean;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const slug = value?.slug || "";
  const classLevel = value?.classLevel || "11";

  useEffect(() => {
    void api<{ subjects: Subject[] }>("/catalog/practice/subjects")
      .then((res) => {
        setSubjects(res.subjects || []);
        if (!value && res.subjects?.[0]) {
          onChange({
            subjectId: res.subjects[0].id,
            slug: res.subjects[0].slug,
            classLevel: "11",
            chapterId: "",
            chapterTitle: "",
          });
        }
      })
      .catch(() => {
        setSubjects([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!slug) return;
    void api<{ chapters: Chapter[] }>(
      `/catalog/practice/subjects/${slug}/classes/${classLevel}/chapters`
    )
      .then((res) => {
        setChapters(res.chapters || []);
        const first = res.chapters?.[0];
        if (first && (!value?.chapterId || !res.chapters.some((c) => c.id === value.chapterId))) {
          onChange({
            subjectId: value?.subjectId || "",
            slug,
            classLevel,
            chapterId: first.id,
            chapterTitle: first.title,
          });
        }
      })
      .catch(() => {
        setChapters([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, classLevel]);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <Pill
            key={s.id}
            active={slug === s.slug}
            onClick={() =>
              onChange({
                subjectId: s.id,
                slug: s.slug,
                classLevel,
                chapterId: "",
                chapterTitle: "",
              })
            }
          >
            {s.name}
          </Pill>
        ))}
      </div>
      <div className="flex gap-2">
        {(["11", "12"] as const).map((lvl) => (
          <Pill
            key={lvl}
            active={classLevel === lvl}
            onClick={() =>
              onChange({
                subjectId: value?.subjectId || "",
                slug,
                classLevel: lvl,
                chapterId: "",
                chapterTitle: "",
              })
            }
          >
            Class {lvl}
          </Pill>
        ))}
      </div>
      {!hideChapter ? (
        <select
          className="w-full max-w-md rounded-xl border border-line bg-black/40 px-4 py-3 text-sm text-ink outline-none focus:border-axiom/60"
          value={value?.chapterId || ""}
          onChange={(e) => {
            const ch = chapters.find((c) => c.id === e.target.value);
            onChange({
              subjectId: value?.subjectId || "",
              slug,
              classLevel,
              chapterId: e.target.value,
              chapterTitle: ch?.title || "",
            });
          }}
        >
          <option value="">Select chapter</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
