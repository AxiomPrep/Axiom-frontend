"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ChapterSummary, formatSelections, isBioSubject, PopularContent, Teacher, teacherInitial, teacherName, teacherSubject } from "@/lib/api";
import { findFacultyTeacher, teacherFromFaculty } from "@/lib/faculty-catalog";
import { useApi } from "@/lib/use-api";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, Pill, Shell } from "@/components/ui";

type ModulesResponse = {
  teacher: Teacher;
  popular_content: PopularContent[];
  chapters: ChapterSummary[];
  modules: string[];
};

function TeacherProfileInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const id = params.id;
  const initialClass = search.get("class") === "12" ? "12" : "11";
  const [classLevel, setClassLevel] = useState<"11" | "12">(initialClass);

  const { data, error, loading } = useApi<ModulesResponse>(
    `/catalog/teachers/${id}/modules?class=${classLevel}`
  );

  const fallback = findFacultyTeacher(id);
  const teacher = data?.teacher || (fallback ? teacherFromFaculty(fallback) : undefined);
  const name = teacher ? teacherName(teacher) : "Teacher";
  const subject = teacher ? teacherSubject(teacher) : "";
  const chapters = data?.chapters || [];
  const popular = data?.popular_content || [];
  const catalogError = teacher && error?.status === 401 ? null : error;

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: "/top-teachers", label: "Top Teachers" },
          { label: subject || "Subject" },
          { label: name },
        ]}
      />

      <ApiStatus error={catalogError} />
      {loading && !teacher ? <LoadingBlock label="Loading profile…" /> : null}

      {teacher ? (
        <div className="mb-10 flex items-center gap-5">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-axiom/40 bg-gradient-to-br from-axiom to-[#9a6f30] font-display text-3xl text-black">
            {teacher.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teacher.image_url} alt="" className="h-[4.5rem] w-[4.5rem] rounded-full object-cover" />
            ) : (
              teacherInitial(teacher)
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
            <p className="mt-1.5 text-xs font-semibold tracking-[0.16em] text-axiom">
              {subject} EXPERT
              {teacher.years_experience != null ? `  ·  ${teacher.years_experience}+ YRS EXP` : ""}
              {teacher.selections_count != null
                ? `  ·  ${formatSelections(teacher.selections_count)} ${isBioSubject(teacher) ? "NEET" : "IIT/NIT"}` 
                : ""}
            </p>
            {teacher.bio ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{teacher.bio}</p> : null}
          </div>
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Popular content</h2>
        {popular.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {popular.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${item.id}?teacher=${id}`}
                className="surface surface-hover flex items-center justify-between rounded-2xl px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {(item.chapters as { title?: string } | null)?.title ||
                      "Most watched lecture for this class."}
                  </p>
                </div>
                <span className="text-xl text-red-500">▶</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No popular lectures yet" body="Published lecture modules will appear here." />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Browse by class</h2>
        <div className="mb-5 flex gap-2">
          {(["11", "12"] as const).map((lvl) => (
            <Pill
              key={lvl}
              active={classLevel === lvl}
              onClick={() => setClassLevel(lvl)}
            >
              Class {lvl}
            </Pill>
          ))}
        </div>

        {chapters.length ? (
          <div className="space-y-3">
            {chapters.map((ch) => (
                <Link
                  key={ch.chapter_id}
                  href={`/top-teachers/${id}/chapters/${ch.chapter_id}?class=${classLevel}`}
                  className="surface surface-hover flex items-center justify-between rounded-2xl px-5 py-4"
                >
                  <p className="font-semibold">{ch.title}</p>
                  <p className="text-sm text-zinc-400">
                    {ch.videos} Videos • {ch.pdfs} PDFs
                  </p>
                </Link>
            ))}
          </div>
        ) : (
          !loading && (
            <EmptyState
              title={`No Class ${classLevel} chapters yet`}
              body="Chapter rows are built from published teacher content."
            />
          )
        )}
      </section>
    </Shell>
  );
}

export default function TeacherProfilePage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <TeacherProfileInner />
    </Suspense>
  );
}
