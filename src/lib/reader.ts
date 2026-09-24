export type ReaderSource = "ncert" | "content" | "quiz" | "test" | "originals" | "tool";

export function readerHref(opts: {
  title?: string;
  source: ReaderSource;
  id: string;
  url?: string | null;
}) {
  const q = new URLSearchParams();
  q.set("source", opts.source);
  q.set("id", opts.id);
  if (opts.title) q.set("title", opts.title);
  if (opts.url) q.set("url", opts.url);
  return `/read?${q.toString()}`;
}

export function isPdfModule(moduleKey?: string | null, type?: string | null) {
  return (
    moduleKey === "notes_pdf" ||
    moduleKey === "important_pdfs" ||
    type === "note_pdf" ||
    type === "pdf" ||
    type === "document"
  );
}
