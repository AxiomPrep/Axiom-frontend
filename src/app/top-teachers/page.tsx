"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatSelections,
  isBioSubject,
  Teacher,
  teacherInitial,
  teacherName,
  teacherSubject,
} from "@/lib/api";
import { SUBJECT_FILTERS } from "@/lib/catalog";
import { listedFacultyTeachers, mergeTeacherLists, teacherMatchesSubject } from "@/lib/faculty-catalog";
import { useApi } from "@/lib/use-api";
import { ApiStatus, EmptyState, LoadingBlock, PageHeader, Pill, Shell } from "@/components/ui";

export default function TopTeachersPage() {
  const [subject, setSubject] = useState<(typeof SUBJECT_FILTERS)[number]>("All");
  const path = subject === "All" ? "/catalog/teachers" : `/catalog/teachers?subject=${encodeURIComponent(subject)}`;
  const { data, error, loading } = useApi<{ teachers: Teacher[] }>(path);
  const teachers = useMemo(
    () => mergeTeacherLists(data?.teachers || [], listedFacultyTeachers()).filter((teacher) => teacherMatchesSubject(teacher, subject)),
    [data?.teachers, subject],
  );

  const counts = useMemo(() => teachers.length, [teachers]);

  return (
    <Shell>
      <PageHeader
        eyebrow="Faculty"
        title="Top Teachers"
        subtitle="Learn from the masters who have produced top AIRs."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {SUBJECT_FILTERS.map((item) => (
          <Pill key={item} active={subject === item} onClick={() => setSubject(item)}>
            {item}
          </Pill>
        ))}
      </div>

      <ApiStatus error={teachers.length && error?.status === 401 ? null : error} />

      {loading ? <LoadingBlock label="Loading teachers…" /> : null}

      {!loading && !teachers.length ? (
        <EmptyState
          title="No teachers in this filter"
          body="When the teachers API returns rows, they appear here as cards."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>

      {!loading && teachers.length ? (
        <p className="mt-6 text-sm text-zinc-500">{counts} teacher{counts === 1 ? "" : "s"}</p>
      ) : null}
    </Shell>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const name = teacherName(teacher);
  const subject = teacherSubject(teacher);
  const selectionsLabel = isBioSubject(teacher) ? "NEET Selections" : "IIT/NIT Selections";

  return (
    <Link
      href={`/top-teachers/${teacher.id}`}
      className="surface surface-hover rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-axiom/30 bg-gradient-to-br from-axiom/30 to-zinc-800 text-lg font-semibold">
          {teacher.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.image_url} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            teacherInitial(teacher)
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
          <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-axiom">{subject}</p>
        </div>
      </div>
      {teacher.bio ? <p className="mt-4 text-sm leading-relaxed text-zinc-400">{teacher.bio}</p> : null}
      <div className="mt-5 space-y-1 rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-zinc-400">
        <p>
          Experience:{" "}
          <span className="font-semibold text-ink">
            {teacher.years_experience != null ? `${teacher.years_experience}+ Years` : "—"}
          </span>
        </p>
        <p>
          {selectionsLabel}:{" "}
          <span className="font-semibold text-ink">{formatSelections(teacher.selections_count)}</span>
        </p>
      </div>
    </Link>
  );
}
