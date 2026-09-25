"use client";

import { useEffect, useRef, useState } from "react";

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

type PdfPage = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvas: HTMLCanvasElement; viewport: unknown }) => { promise: Promise<void> };
};

export function PdfQuestionFigure({ src, page }: { src: string; page: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!src || !page) return;
      try {
        ensurePdfJsMaps();
        const pdfjs = (await import(/* webpackIgnore: true */ "/pdf.min.mjs")) as {
          getDocument: (opts: { data: Uint8Array }) => { promise: Promise<{ getPage: (n: number) => Promise<PdfPage> }> };
          GlobalWorkerOptions: { workerSrc: string };
        };
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = new Uint8Array(await (await fetch(src)).arrayBuffer());
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: 1.25 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pdfPage.render({ canvas, viewport }).promise;
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    void draw();
    return () => {
      cancelled = true;
    };
  }, [src, page]);

  if (failed) return null;
  return <canvas ref={canvasRef} className="mt-4 max-w-full rounded-xl border border-line bg-white" />;
}
