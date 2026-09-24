"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BookReader, BookAnnotation, HtmlPage } from "@/components/BookReader";
import { Breadcrumbs, LoadingBlock, Shell } from "@/components/ui";
import { useApi } from "@/lib/use-api";

type ContentRes = {
  content: { id: string; title: string; description: string | null };
  play_url: string | null;
};

type NcertRes = {
  book: { id: string; title: string; class_level?: string | null; subjects?: { name?: string } | null };
  read_url: string | null;
  prehighlights: BookAnnotation[];
  annotations: BookAnnotation[];
};

type AnnRes = { annotations: BookAnnotation[] };

function ReadInner() {
  const search = useSearchParams();
  const source = search.get("source") || "content";
  const id = search.get("id") || "";
  const titleParam = search.get("title") || "Book";
  const urlParam = search.get("url");

  const liveId = id && !id.startsWith("demo-") ? id : "";
  const contentApi = useApi<ContentRes>(source === "content" && liveId ? `/catalog/contents/${liveId}` : null);
  const ncertApi = useApi<NcertRes>(source === "ncert" && liveId ? `/api/ncert/${liveId}` : null);
  const sourceType =
    source === "ncert" ? "ncert" : source === "quiz" ? "quiz" : source === "test" ? "test" : "originals";
  const uuidish = /^[0-9a-f-]{36}$/i.test(id);
  const annApi = useApi<AnnRes>(
    uuidish && source !== "ncert" ? `/api/annotations?source_type=${sourceType}&source_id=${id}` : null
  );

  const title = ncertApi.data?.book.title || contentApi.data?.content.title || titleParam;
  const pdfUrl = ncertApi.data?.read_url || contentApi.data?.play_url || urlParam;
  const htmlPages = useMemo<HtmlPage[] | undefined>(() => {
    if (pdfUrl) return undefined;
    if (source === "ncert") return ncertDemoPages(title);
    if (source === "quiz" || source === "test") return quizBookPages(title);
    if (source === "tool" || source === "originals") return toolPages(title);
    return undefined;
  }, [source, title, pdfUrl]);

  const loading = contentApi.loading || ncertApi.loading;

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: source === "ncert" ? "/timer?tab=ncert" : "/originals", label: source === "ncert" ? "Study Hub" : "Library" },
          { label: title },
        ]}
      />
      {loading ? <LoadingBlock label="Opening book…" /> : null}
      <BookReader
        title={title}
        pdfUrl={pdfUrl}
        htmlPages={htmlPages}
        sourceType={source === "ncert" ? "ncert" : sourceType}
        sourceId={id || "demo-book"}
        bookId={source === "ncert" ? id : null}
        prehighlights={ncertApi.data?.prehighlights || []}
        initialAnnotations={ncertApi.data?.annotations || annApi.data?.annotations || []}
        ncertMode={source === "ncert"}
      />
    </Shell>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <ReadInner />
    </Suspense>
  );
}

function ncertDemoPages(title: string): HtmlPage[] {
  return [
    { heading: title, body: "NCERT Class text · Axiom Prep shelf copy.\n\nThis leaf is a working flipbook so you can highlight, draw, and pin notes before a storage file is attached." },
    { heading: "Key idea", body: "Read the derivation slowly. Mark the assumption line in gold, then write why the next step is allowed." },
    { heading: "Exercise cue", body: "Close the book and attempt 8–10 related problems. Return here only to check a definition, not to copy the method." },
    { heading: "Faculty pre-highlight", body: "Pre-highlights from the published NCERT overlay appear as gold marks when the catalog is live." },
  ];
}

function quizBookPages(title: string): HtmlPage[] {
  return Array.from({ length: 8 }, (_, i) => ({
    heading: i === 0 ? title : `Working leaf ${i + 1}`,
    body:
      i === 0
        ? "Use this booklet while you sit the quiz. Sketch options, strike out traps, and pin why an option dies."
        : "Blank working space. Draw, highlight, and leave a one-line note. Marks reload the next time you open this set.",
  }));
}

function toolPages(title: string): HtmlPage[] {
  return [
    { heading: title, body: "Formula sheets, maps, and short notes use the same reader as NCERT." },
    { heading: "Recall", body: "Cover the right-hand side and recast the result. If you stall, uncover one line only." },
  ];
}
