'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  saveAnnotation,
  getAnnotations,
  type AnnotationRecord,
} from '@/lib/study-api'
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  PenLine,
  Eraser,
  Undo2,
  Save,
  Trash2,
  Check,
} from "lucide-react"

interface Stroke {
  color: string
  size: number
  points: { x: number; y: number }[]
}

type Tool = 'highlight' | 'pen' | 'eraser'

interface BookReaderProps {
  title: string
  subtitle?: string
  pages: string[]
  setId: string
}

const HIGHLIGHT_COLORS = ['#fbbf24', '#fde047', '#34d399', '#60a5fa', '#f472b6']
const PEN_COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ffffff']

export default function AnnotationReader({ title, subtitle, pages, setId }: BookReaderProps) {
  const [page, setPage] = useState(0)
  const [flipping, setFlipping] = useState<'forward' | 'back' | null>(null)
  const [tool, setTool] = useState<Tool>('highlight')
  const [highlightColor, setHighlightColor] = useState('#fbbf24')
  const [penColor, setPenColor] = useState('#f59e0b')
  const [penSize, setPenSize] = useState(3)
  const [saved, setSaved] = useState(true)

  const [strokesByPage, setStrokesByPage] = useState<Record<number, Stroke[]>>({})
  const [htmlByPage, setHtmlByPage] = useState<Record<number, string>>({})

  const contentRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)

  const totalPages = Math.max(pages.length, 1)

  /* ---------------- load persisted annotations ---------------- */
  useEffect(() => {
    let active = true
    getAnnotations(setId)
      .then((records: AnnotationRecord[]) => {
        if (!active) return
        const strokes: Record<number, Stroke[]> = {}
        const html: Record<number, string> = {}
        records.forEach((r) => {
          strokes[r.page] = r.strokes
          if (r.html) html[r.page] = r.html
        })
        setStrokesByPage(strokes)
        setHtmlByPage(html)
      })
      .catch(() => {
        if (!active) return
        setStrokesByPage({})
        setHtmlByPage({})
      })
    return () => {
      active = false
    }
  }, [setId])

  /* ---------------- drawing helpers ---------------- */
  const ensureCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(rect.width, 1)
    const h = Math.max(rect.height, 1)
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ctx = canvas.getContext('2d')
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    ensureCanvasSize()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)

    const strokes = [...(strokesByPage[page] || [])]
    if (currentStrokeRef.current) strokes.push(currentStrokeRef.current)

    strokes.forEach((s) => {
      ctx.save()
      if (s.color === 'erase') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = s.color
      }
      ctx.lineWidth = s.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
      ctx.restore()
    })
  }, [page, strokesByPage, ensureCanvasSize])

  // Restore content + canvas when the page changes or persisted html loads
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = htmlByPage[page] ?? pages[page] ?? ''
    }
    redrawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, htmlByPage])

  // Redraw committed strokes when they change (undo / clear / load)
  useEffect(() => {
    redrawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokesByPage])

  useEffect(() => {
    const onResize = () => redrawCanvas()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [redrawCanvas])

  /* ---------------- drawing pointer handlers ---------------- */
  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const drawSegment = (from: { x: number; y: number }, to: { x: number; y: number }, stroke: Stroke) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    if (stroke.color === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
    }
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (tool !== 'pen' && tool !== 'eraser') return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const pos = getPos(e)
    currentStrokeRef.current = {
      color: tool === 'eraser' ? 'erase' : penColor,
      size: tool === 'eraser' ? penSize * 3 : penSize,
      points: [pos],
    }
    setSaved(false)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !currentStrokeRef.current) return
    const pos = getPos(e)
    const points = currentStrokeRef.current.points
    const last = points[points.length - 1]
    drawSegment(last, pos, currentStrokeRef.current)
    points.push(pos)
  }

  const handlePointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const stroke = currentStrokeRef.current
    currentStrokeRef.current = null
    if (stroke && stroke.points.length > 0) {
      setStrokesByPage((prev) => ({
        ...prev,
        [page]: [...(prev[page] || []), stroke],
      }))
    }
  }

  /* ---------------- highlight ---------------- */
  const handleMouseUp = () => {
    if (tool !== 'highlight') return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    if (!contentRef.current?.contains(range.commonAncestorContainer)) return
    try {
      const mark = document.createElement('mark')
      mark.style.backgroundColor = highlightColor
      mark.style.color = '#0a0a0a'
      mark.style.borderRadius = '2px'
      mark.style.padding = '0 2px'
      range.surroundContents(mark)
      sel.removeAllRanges()
      setSaved(false)
    } catch {
      /* selection spans multiple nodes — ignore for v1 */
    }
  }

  /* ---------------- persistence ---------------- */
  const saveCurrent = useCallback(async () => {
    const html = contentRef.current?.innerHTML ?? pages[page] ?? ''
    const marks: { text: string; color: string }[] = []
    contentRef.current?.querySelectorAll('mark').forEach((m) => {
      marks.push({ text: m.textContent || '', color: m.style.backgroundColor })
    })
    setHtmlByPage((prev) => ({ ...prev, [page]: html }))
    await saveAnnotation({
      setId,
      page,
      highlights: marks,
      strokes: strokesByPage[page] || [],
      html,
    })
    setSaved(true)
  }, [page, pages, setId, strokesByPage])

  const goTo = (dir: 'forward' | 'back') => {
    if (flipping) return
    const next = dir === 'forward' ? page + 1 : page - 1
    if (next < 0 || next >= totalPages) return
    saveCurrent()
    setFlipping(dir)
    window.setTimeout(() => {
      setPage(next)
      setFlipping(null)
    }, 320)
  }

  const undoStroke = () => {
    setStrokesByPage((prev) => {
      const list = [...(prev[page] || [])]
      list.pop()
      return { ...prev, [page]: list }
    })
    setSaved(false)
  }

  const clearPage = () => {
    setStrokesByPage((prev) => ({ ...prev, [page]: [] }))
    if (contentRef.current) contentRef.current.innerHTML = pages[page] ?? ''
    setHtmlByPage((prev) => ({ ...prev, [page]: pages[page] ?? '' }))
    saveAnnotation({ setId, page, highlights: [], strokes: [], html: pages[page] ?? '' })
    redrawCanvas()
    setSaved(true)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <p className="font-display text-lg italic text-axiom">Reader</p>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
        <button type="button" onClick={saveCurrent} className="btn-primary h-10 gap-2 px-4 text-sm">
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      <div className="surface flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="flex items-center gap-1 rounded-full border border-line p-1">
          {(
            [
              ["highlight", Highlighter, "Highlight"],
              ["pen", PenLine, "Pen"],
              ["eraser", Eraser, "Eraser"],
            ] as const
          ).map(([t, Icon, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTool(t)}
              title={label}
              className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
                tool === t ? "bg-axiom text-black" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-line" />

        {/* Highlight colors */}
        {tool === 'highlight' && (
          <div className="flex items-center gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setHighlightColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition ${
                  highlightColor === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Pen colors + size */}
        {(tool === 'pen' || tool === 'eraser') && (
          <>
            {tool === 'pen' && (
              <div className="flex items-center gap-1.5">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition ${
                  penColor === c ? "border-axiom scale-110" : "border-transparent"
                }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-1">
              {[2, 4, 6, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setPenSize(s)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold transition ${
                    penSize === s ? "border-axiom bg-axiom/15 text-axiom" : "border-line text-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={undoStroke}
            title="Undo stroke"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-ink transition"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={clearPage}
            title="Clear page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-rose-400 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Book page */}
      <div className="perspective-book">
        <div
          className={`book-page surface relative min-h-[480px] rounded-2xl p-6 sm:p-10 ${
            flipping === 'forward' ? 'flip-forward' : flipping === 'back' ? 'flip-back' : ''
          } ${flipping === null ? 'book-page-enter' : ''}`}
        >
          {/* Page corner / book feel */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-line/70" />

          {/* Text content (highlightable) */}
          <div
            ref={contentRef}
            contentEditable={tool === 'highlight'}
            suppressContentEditableWarning
            onMouseUp={handleMouseUp}
            className="relative z-0 whitespace-pre-wrap text-sm leading-relaxed text-ink outline-none sm:text-base"
          />

          {/* Drawing canvas overlay */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 z-10 h-full w-full touch-none rounded-2xl"
            style={{ pointerEvents: tool === 'pen' || tool === 'eraser' ? 'auto' : 'none' }}
          />
        </div>
      </div>

      {/* Page navigation */}
      <div className="surface flex items-center justify-between rounded-2xl p-3">
        <button
          type="button"
          onClick={() => goTo("back")}
          disabled={page === 0}
          className="btn-ghost h-10 gap-1.5 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <div className="text-center">
          <div className="font-display text-lg font-semibold text-ink">
            {page + 1} <span className="text-zinc-500">/</span> {totalPages}
          </div>
          <div className="text-[11px] text-muted">Highlight and annotate. Notes stay on this device.</div>
        </div>

        <button
          type="button"
          onClick={() => goTo("forward")}
          disabled={page >= totalPages - 1}
          className="btn-primary h-10 gap-1.5 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
