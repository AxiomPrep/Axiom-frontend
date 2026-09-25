"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

export type BookAnnotation = {
  id?: string;
  page_number: number;
  annotation_type: "highlight" | "draw" | "note";
  color: string;
  payload: Record<string, unknown>;
};

export type HtmlPage = {
  heading?: string;
  body: string;
};

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
};

type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: {
    canvas?: HTMLCanvasElement;
    canvasContext?: CanvasRenderingContext2D;
    viewport: unknown;
  }) => { promise: Promise<void> };
};

const COLORS = ["#FDE68A", "#d4a15a", "#86EFAC", "#7DD3FC", "#F9A8D4"];

function ensurePdfJsMaps() {
  const proto = Map.prototype as Map<unknown, unknown> & {
    getOrInsert?: (key: unknown, value: unknown) => unknown;
    getOrInsertComputed?: (key: unknown, compute: (key: unknown) => unknown) => unknown;
  };
  if (!proto.getOrInsert) {
    proto.getOrInsert = function (key, value) {
      if (this.has(key)) return this.get(key);
      this.set(key, value);
      return value;
    };
  }
  if (!proto.getOrInsertComputed) {
    proto.getOrInsertComputed = function (key, compute) {
      if (this.has(key)) return this.get(key);
      const value = compute(key);
      this.set(key, value);
      return value;
    };
  }
}

export function BookReader({
  title,
  pdfUrl,
  htmlPages,
  sourceType,
  sourceId,
  bookId,
  prehighlights = [],
  initialAnnotations = [],
  ncertMode = false,
}: {
  title: string;
  pdfUrl?: string | null;
  htmlPages?: HtmlPage[];
  sourceType: "practice" | "pyq" | "quiz" | "test" | "originals" | "ncert";
  sourceId: string;
  bookId?: string | null;
  prehighlights?: BookAnnotation[];
  initialAnnotations?: BookAnnotation[];
  ncertMode?: boolean;
}) {
  const pdfDoc = useRef<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(htmlPages?.length || 1);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(Boolean(pdfUrl));
  const [spread, setSpread] = useState(false);
  const [tool, setTool] = useState<"highlight" | "draw" | "note" | "erase">("highlight");
  const [color, setColor] = useState(COLORS[0]);
  const [note, setNote] = useState("");
  const [annotations, setAnnotations] = useState<BookAnnotation[]>(initialAnnotations);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const drawing = useRef(false);
  const path = useRef<{ x: number; y: number }[]>([]);
  const erased = useRef<Set<string>>(new Set());
  const drawPage = useRef(1);

  const pages = useMemo(() => htmlPages || defaultPages(title), [htmlPages, title]);
  const step = spread ? 2 : 1;
  const leftPage = spread ? page - ((page - 1) % 2) : page;
  const rightPage = leftPage + 1;
  const showRight = spread && rightPage <= pageCount;

  useEffect(() => {
    const sync = () => setSpread(window.innerWidth >= 860);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPdf() {
      if (!pdfUrl) {
        pdfDoc.current = null;
        setPdfReady(false);
        setPdfLoading(false);
        setPageCount(pages.length);
        return;
      }
      setPdfLoading(true);
      try {
        ensurePdfJsMaps();
        const pdfjs = (await import(/* webpackIgnore: true */ "/pdf.min.mjs")) as {
          getDocument: (opts: { data: Uint8Array }) => { promise: Promise<PdfDoc> };
          GlobalWorkerOptions: { workerSrc: string };
        };
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = new Uint8Array(await (await fetch(pdfUrl)).arrayBuffer());
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        pdfDoc.current = doc;
        setPageCount(doc.numPages);
        setPdfReady(true);
      } catch (err) {
        if (!cancelled) {
          pdfDoc.current = null;
          setPdfReady(false);
          setPageCount(pages.length);
          setStatus("This book could not be opened as leaves.");
        }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }
    void loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pages.length]);

  function flip(dir: "forward" | "back") {
    const next = dir === "forward" ? leftPage + step : leftPage - step;
    if (next < 1 || next > pageCount) return;
    setPage(next);
  }

  function overlayPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    if (!el.width || !el.height) {
      el.width = Math.max(1, Math.floor(rect.width));
      el.height = Math.max(1, Math.floor(rect.height));
    }
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function hitsMark(mark: BookAnnotation, pt: { x: number; y: number }) {
    if (mark.annotation_type === "note") return pt.x > 0.78 && pt.y < 0.18;
    const pts = (mark.payload.path as { x: number; y: number }[] | undefined) || [];
    const reach = mark.annotation_type === "highlight" ? 0.045 : 0.028;
    return pts.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < reach);
  }

  function eraseAt(pt: { x: number; y: number }, pageNumber: number) {
    const victims = annotations.filter((a) => a.page_number === pageNumber && hitsMark(a, pt));
    for (const mark of victims) {
      const key = mark.id || `${mark.annotation_type}-${JSON.stringify(mark.payload).slice(0, 24)}`;
      if (erased.current.has(key)) continue;
      erased.current.add(key);
      void removeAnn(mark.id);
    }
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>, pageNumber: number) {
    if (tool === "note") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    drawPage.current = pageNumber;
    const pt = overlayPoint(e);
    path.current = [pt];
    if (tool === "erase") eraseAt(pt, pageNumber);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>, pageNumber: number) {
    if (!drawing.current) return;
    const pt = overlayPoint(e);
    path.current.push(pt);
    const canvas = e.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx || path.current.length < 2) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "erase") {
      eraseAt(pt, pageNumber);
      ctx.strokeStyle = "rgba(120, 110, 95, 0.45)";
      ctx.lineWidth = 28;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === "highlight" ? 18 : 2.5;
      ctx.globalAlpha = tool === "highlight" ? 0.35 : 1;
    }
    ctx.beginPath();
    path.current.forEach((p, i) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  async function persist(ann: Omit<BookAnnotation, "id">) {
    setSaving(true);
    setStatus(null);
    try {
      if (ncertMode) {
        const res = await api<{ annotation: BookAnnotation }>(`/api/ncert/${sourceId}`, {
          method: "POST",
          body: JSON.stringify({
            page_number: ann.page_number,
            annotation_type: ann.annotation_type,
            color: ann.color,
            payload: ann.payload,
          }),
        });
        setAnnotations((prev) => [...prev, res.annotation]);
      } else {
        const res = await api<{ annotation: BookAnnotation }>("/api/annotations", {
          method: "POST",
          body: JSON.stringify({
            source_type: sourceType,
            source_id: sourceId,
            book_id: bookId,
            page_number: ann.page_number,
            annotation_type: ann.annotation_type,
            color: ann.color,
            payload: ann.payload,
          }),
        });
        setAnnotations((prev) => [...prev, res.annotation]);
      }
      setStatus("Saved to your notebook");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save that annotation.");
    } finally {
      setSaving(false);
    }
  }

  async function onUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = e.currentTarget;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    if (tool === "erase") {
      path.current = [];
      erased.current = new Set();
      return;
    }
    if (path.current.length < 2) return;
    await persist({
      page_number: drawPage.current,
      annotation_type: tool === "highlight" ? "highlight" : "draw",
      color,
      payload: { path: path.current },
    });
    path.current = [];
  }

  async function clearPageMarks() {
    const mine = annotations.filter((a) => a.page_number === leftPage || (showRight && a.page_number === rightPage));
    for (const mark of mine) await removeAnn(mark.id);
    setStatus(mine.length ? "Erased marks on this leaf" : "Nothing to erase on this leaf");
  }

  async function addNote() {
    const text = note.trim();
    if (!text) return;
    await persist({ page_number: leftPage, annotation_type: "note", color, payload: { text } });
    setNote("");
  }

  async function removeAnn(id?: string) {
    if (!id || id.startsWith("local-")) {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      return;
    }
    try {
      await api(`/api/annotations?id=${id}`, { method: "DELETE" });
    } catch {
      /* keep optimistic */
    }
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  const leafMarks = (n: number) => [...prehighlights, ...annotations].filter((a) => a.page_number === n);
  const notes = leafMarks(leftPage).filter((m) => m.annotation_type === "note");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-axiom">Interactive book</p>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Leaf {leftPage}
          {showRight ? `–${rightPage}` : ""} / {pageCount}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["highlight", "draw", "note", "erase"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTool(t)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              tool === t ? "bg-axiom text-black" : "border border-line text-zinc-300"
            }`}
          >
            {t === "erase" ? "Eraser" : t}
          </button>
        ))}
        {tool !== "erase"
          ? COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full border border-white/20"
                style={{ background: c, outline: color === c ? "2px solid #d4a15a" : undefined }}
                aria-label={c}
              />
            ))
          : (
              <button type="button" onClick={() => void clearPageMarks()} className="btn-ghost h-8 px-3 text-xs">
                Clear leaf
              </button>
            )}
        {saving ? <span className="text-xs text-zinc-500">Saving…</span> : null}
      </div>

      <div className="perspective-book">
        <div className={`book-spread ${spread ? "is-spread" : "is-single"}`}>
          <button type="button" className="book-edge book-edge-left" aria-label="Previous leaf" onClick={() => flip("back")} />
          <BookLeaf
            pageNumber={leftPage}
            pageCount={pageCount}
            title={title}
            html={pages[leftPage - 1]}
            pdfReady={pdfReady}
            pdfLoading={pdfLoading}
            pdfDoc={pdfDoc.current}
            marks={leafMarks(leftPage)}
            tool={tool}
            onDown={onDown}
            onMove={onMove}
            onUp={onUp}
          />
          {spread ? (
            <>
              <div className="book-spine" aria-hidden />
              {showRight ? (
                <BookLeaf
                  pageNumber={rightPage}
                  pageCount={pageCount}
                  title={title}
                  html={pages[rightPage - 1]}
                  pdfReady={pdfReady}
                  pdfLoading={pdfLoading}
                  pdfDoc={pdfDoc.current}
                  marks={leafMarks(rightPage)}
                  tool={tool}
                  onDown={onDown}
                  onMove={onMove}
                  onUp={onUp}
                />
              ) : (
                <div className="book-leaf book-endpaper" />
              )}
            </>
          ) : null}
          <button type="button" className="book-edge book-edge-right" aria-label="Next leaf" onClick={() => flip("forward")} />
        </div>
      </div>

      {tool === "erase" ? (
        <p className="text-sm text-zinc-400">
          Drag over your highlights or drawings to erase them. Faculty pre-marks stay.
        </p>
      ) : null}

      {tool === "note" ? (
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a margin note for this leaf"
            className="h-11 flex-1 rounded-xl border border-line bg-black/40 px-4 text-sm outline-none focus:border-axiom"
          />
          <button type="button" onClick={() => void addNote()} className="btn-primary h-11 px-5 text-sm">
            Pin note
          </button>
        </div>
      ) : null}

      {status ? <p className="text-sm text-zinc-400">{status}</p> : null}

      <div className="surface flex items-center justify-between rounded-2xl p-3">
        <button
          type="button"
          className="btn-ghost h-10 gap-1.5 px-4 text-sm disabled:opacity-40"
          onClick={() => flip("back")}
          disabled={leftPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <p className="text-[11px] text-muted">Flip the leaves. The page fits the book, not a PDF chrome.</p>
        <button
          type="button"
          className="btn-primary h-10 gap-1.5 px-4 text-sm disabled:opacity-40"
          onClick={() => flip("forward")}
          disabled={leftPage >= pageCount}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {notes.length ? (
        <div className="surface rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-axiom">Notes on this leaf</p>
          <ul className="mt-2 space-y-2">
            {notes.map((m, i) => (
              <li key={m.id || i} className="flex justify-between gap-3 text-sm">
                <span>{String(m.payload.text || "")}</span>
                <button type="button" className="text-zinc-500 hover:text-white" onClick={() => void removeAnn(m.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BookLeaf({
  pageNumber,
  pageCount,
  title,
  html,
  pdfReady,
  pdfLoading,
  pdfDoc,
  marks,
  tool,
  onDown,
  onMove,
  onUp,
}: {
  pageNumber: number;
  pageCount: number;
  title: string;
  html?: HtmlPage;
  pdfReady: boolean;
  pdfLoading?: boolean;
  pdfDoc: PdfDoc | null;
  marks: BookAnnotation[];
  tool: "highlight" | "draw" | "note" | "erase";
  onDown: (e: React.PointerEvent<HTMLCanvasElement>, pageNumber: number) => void;
  onMove: (e: React.PointerEvent<HTMLCanvasElement>, pageNumber: number) => void;
  onUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const painted = useRef("");

  const paint = useCallback(async () => {
    const frame = frameRef.current;
    const canvas = pdfCanvasRef.current;
    const overlay = overlayRef.current;
    if (!frame) return;
    const spreadEl = frame.closest(".book-spread") as HTMLElement | null;
    const availW = Math.floor(frame.clientWidth || spreadEl?.clientWidth || 0);
    const availH = Math.floor(frame.clientHeight || spreadEl?.clientHeight || 0);
    if (availW < 120 || availH < 160) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const key = `${pageNumber}:${availW}x${availH}:${pdfReady ? "pdf" : "html"}:${dpr}`;
    if (painted.current === key) return;
    painted.current = key;
    if (pdfReady && pdfDoc && canvas) {
      const pdfPage = await pdfDoc.getPage(pageNumber);
      if (painted.current !== key) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const fit = Math.min(availW / base.width, availH / base.height);
      const viewport = pdfPage.getViewport({ scale: fit * dpr });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      if (painted.current !== key) return;
      if (overlay) {
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        overlay.style.width = canvas.style.width;
        overlay.style.height = canvas.style.height;
      }
      return;
    }
    if (overlay) {
      overlay.width = Math.floor(availW * dpr);
      overlay.height = Math.floor(availH * dpr);
      overlay.style.width = "100%";
      overlay.style.height = "100%";
    }
  }, [pageNumber, pdfDoc, pdfReady]);

  useEffect(() => {
    painted.current = "";
    let alive = true;
    const run = () => {
      if (alive) void paint();
    };
    const id = window.requestAnimationFrame(() => window.requestAnimationFrame(run));
    const frame = frameRef.current;
    const observer = frame ? new ResizeObserver(run) : null;
    if (frame && observer) observer.observe(frame);
    return () => {
      alive = false;
      window.cancelAnimationFrame(id);
      observer?.disconnect();
    };
  }, [paint]);

  return (
    <div className="book-leaf">
      <div ref={frameRef} className="book-leaf-inner">
        {pdfReady ? (
          <canvas ref={pdfCanvasRef} className="book-pdf-page" />
        ) : pdfLoading ? (
          <article className="book-html-page">
            <p className="font-display text-sm italic text-[#8a6a38]">AXIOM PREP</p>
            <h2 className="mt-4 font-display text-3xl font-semibold">Opening this book…</h2>
            <p className="mt-5 text-[1.05rem] leading-8">Fitting the pages to these leaves.</p>
          </article>
        ) : (
          <article className="book-html-page">
            <p className="font-display text-sm italic text-[#8a6a38]">AXIOM PREP · {title}</p>
            <h2 className="mt-4 font-display text-3xl font-semibold">{html?.heading || `Leaf ${pageNumber}`}</h2>
            <p className="mt-5 whitespace-pre-wrap text-[1.05rem] leading-8">{html?.body}</p>
          </article>
        )}
        <canvas
          ref={overlayRef}
          className={`book-overlay ${tool === "erase" ? "cursor-cell" : "cursor-crosshair"}`}
          onPointerDown={(e) => onDown(e, pageNumber)}
          onPointerMove={(e) => onMove(e, pageNumber)}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        <MarkLayer marks={marks} />
        <span className="book-folio">{pageNumber} / {pageCount}</span>
      </div>
    </div>
  );
}

function MarkLayer({ marks }: { marks: BookAnnotation[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {marks.map((m, i) => {
        if (m.annotation_type === "note") {
          return (
            <span
              key={m.id || i}
              className="absolute right-4 top-6 rounded-md px-2 py-1 text-[11px] font-medium"
              style={{ background: m.color, color: "#111" }}
            >
              Note
            </span>
          );
        }
        const pts = (m.payload.path as { x: number; y: number }[] | undefined) || [];
        if (!pts.length) return null;
        return (
          <svg key={m.id || i} className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={m.color}
              strokeWidth={m.annotation_type === "highlight" ? 0.04 : 0.008}
              strokeOpacity={m.annotation_type === "highlight" ? 0.35 : 0.9}
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          </svg>
        );
      })}
    </div>
  );
}

function defaultPages(title: string): HtmlPage[] {
  return [
    {
      heading: title,
      body: "This booklet opens in Axiom Prep’s page-flip reader. Highlight, draw, and pin notes. Pre-marked lines from faculty appear in gold; your marks sync through /api/annotations.",
    },
    {
      heading: "How to annotate",
      body: "Use Highlight for key results, Draw for diagrams, and Note for a one-line reminder. Marks save per page and reload the next time you open this book.",
    },
    {
      heading: "Study cue",
      body: "After you finish a leaf, close the book and attempt the linked quiz or lecture PYQs. The reader is shared across NCERT, teacher notes, and Originals tools.",
    },
  ];
}
