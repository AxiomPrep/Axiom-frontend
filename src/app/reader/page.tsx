"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AnnotationReader from "@/components/AnnotationReader";
import { getPracticeSetPages, getPyqSetPages } from "@/lib/study-api";
import { EmptyState, LoadingBlock, Shell } from "@/components/ui";

function ReaderContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "practice";
  const subjectId = searchParams.get("subject") || "";
  const classLevel = searchParams.get("class") || "11";
  const chapterId = searchParams.get("chapter") || "";
  const tierId = parseInt(searchParams.get("tier") || "1", 10);
  const setIdParam = searchParams.get("set") || "";

  const [pages, setPages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    setPages([]);
    if (type === "pyq") {
      getPyqSetPages(setIdParam)
        .then((next) => {
          if (!active) return;
          setPages(next);
          setTitle("PYQ exam set");
          setSubtitle(setIdParam.replace(/-/g, " ").toUpperCase());
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : "Could not load this PYQ set.");
        });
      return () => {
        active = false;
      };
    }
    getPracticeSetPages({
      subject: subjectId,
      chapterId,
      tier: tierId,
      classLevel,
    })
      .then((next) => {
        if (!active) return;
        setPages(next.pages);
        setTitle(next.title);
        setSubtitle(next.subtitle);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load this practice set.");
      });
    return () => {
      active = false;
    };
  }, [type, setIdParam, subjectId, classLevel, chapterId, tierId]);

  const setId = type === "pyq" ? `pyq-${setIdParam}` : `practice-${subjectId}-${classLevel}-${chapterId}-${tierId}`;

  return (
    <Shell>
      <Link href={type === "pyq" ? "/pyq-bank" : "/practice"} className="mb-6 inline-block text-sm font-medium text-axiom hover:text-axiom-hover">
        Back
      </Link>
      {error ? <EmptyState title="Reader could not load" body={error} /> : null}
      {!error && pages.length > 0 ? (
        <AnnotationReader title={title} subtitle={subtitle} pages={pages} setId={setId} />
      ) : null}
      {!error && pages.length === 0 ? <LoadingBlock label="Loading reader…" /> : null}
    </Shell>
  );
}

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-sm text-muted">Loading reader…</p>
        </Shell>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
