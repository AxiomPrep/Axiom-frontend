"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/lib/admin-destinations";
import { api, parseTimeline } from "@/lib/api";
import { saveAttempt } from "@/lib/attempts";
import { isPdfModule, readerHref } from "@/lib/reader";
import { useApi } from "@/lib/use-api";
import { Breadcrumbs, EmptyState, LoadingBlock, Pill, Shell } from "@/components/ui";
import { useRouter } from "next/navigation";

type ContentResponse = {
  content: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    module?: string | null;
    chapter_id: string | null;
    teacher_id: string | null;
    duration_sec: number | null;
    is_free_preview: boolean;
    timeline?: unknown;
  };
  play_url: string | null;
  timeline: unknown;
};

type RelatedPyq = {
  prompt?: string;
  exam: string;
  questions: { id: string; stem: string; difficulty?: string; year?: number; exam?: string; options?: string[] | null }[];
  attempt?: { id: string };
};

type YtPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  playVideo: () => void;
  destroy?: () => void;
};

type YtWindow = Window & {
  YT?: { Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YtPlayer };
  onYouTubeIframeAPIReady?: () => void;
};

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as YtWindow;
  if (w.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (w.YT?.Player || Date.now() - started > 8000) {
        window.clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
const PYQ_LIMIT: Record<"jee_main" | "neet" | "jee_adv", number> = {
  jee_main: 10,
  neet: 10,
  jee_adv: 5,
};

function LecturePlayerInner() {
  const params = useParams<{ contentId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const teacherId = search.get("teacher");
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeFrameRef = useRef<HTMLIFrameElement>(null);
  const youtubePlayerRef = useRef<YtPlayer | null>(null);
  const banked = useRef(0);
  const [tab, setTab] = useState<"timeline" | "notes" | "related">("timeline");
  const [exam, setExam] = useState<"jee_main" | "neet" | "jee_adv">("jee_main");
  const [pyq, setPyq] = useState<RelatedPyq | null>(null);
  const [pyqError, setPyqError] = useState<string | null>(null);
  const [pyqLoading, setPyqLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [starting, setStarting] = useState(false);
  const speedRef = useRef(1);

  const { data, error, loading } = useApi<ContentResponse>(`/catalog/contents/${params.contentId}`);
  const content = data?.content || null;
  const cues = useMemo(
    () => parseTimeline(data?.timeline ?? content?.timeline),
    [data?.timeline, content?.timeline]
  );
  const playUrl = data?.play_url || null;
  const youtubeUrl = playUrl ? youtubeEmbedUrl(playUrl) : null;
  speedRef.current = speed;

  const chapterApi = useApi<{ items: { id: string; type: string; module: string | null; sort_order: number }[] }>(
    teacherId && content?.chapter_id ? `/catalog/teachers/${teacherId}/chapters/${content.chapter_id}` : null
  );

  const nextLecture = useMemo(() => {
    const items = chapterApi.data?.items || [];
    const videos = items.filter((i) => i.type === "video" || i.module === "lectures");
    const idx = videos.findIndex((i) => i.id === params.contentId);
    return idx >= 0 ? videos[idx + 1] : videos[0];
  }, [chapterApi.data, params.contentId]);

  useEffect(() => {
    if (content && isPdfModule(content.module, content.type)) {
      router.replace(
        readerHref({
          source: "content",
          id: content.id,
          title: content.title,
          url: playUrl,
        })
      );
    }
  }, [content, playUrl, router]);

  useEffect(() => {
    if (!youtubeUrl) {
      setEmbedSrc(null);
      return;
    }
    const url = new URL(youtubeUrl);
    url.searchParams.set("origin", window.location.origin);
    setEmbedSrc(url.toString());
  }, [youtubeUrl]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.playbackRate = Math.min(speed, 1.5);
    youtubePlayerRef.current?.setPlaybackRate?.(Math.min(speed, 1.5));
  }, [speed, playUrl]);

  useEffect(() => {
    if (!embedSrc) {
      youtubePlayerRef.current = null;
      return;
    }
    let cancelled = false;
    let player: YtPlayer | null = null;

    void loadYoutubeApi().then(() => {
      if (cancelled) return;
      const w = window as YtWindow;
      const frame = youtubeFrameRef.current;
      if (!w.YT?.Player || !frame) return;
      player = new w.YT.Player(frame, {
        events: {
          onReady: (event: { target: YtPlayer }) => {
            youtubePlayerRef.current = event.target;
            event.target.setPlaybackRate?.(Math.min(speedRef.current, 1.5));
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) {
              setCompleted(true);
              setTab("related");
            }
          },
        },
      });
      youtubePlayerRef.current = player;
    });

    return () => {
      cancelled = true;
      youtubePlayerRef.current = null;
      player?.destroy?.();
    };
  }, [embedSrc]);

  async function bankWatch(seconds: number) {
    if (seconds < 5) return;
    try {
      await api(`/catalog/contents/${params.contentId}`, {
        method: "POST",
        body: JSON.stringify({ action: "lecture_watch", watched_sec: Math.floor(seconds) }),
      });
    } catch {
      /* watch progress is best-effort */
    }
  }

  function onTime() {
    const el = videoRef.current;
    if (!el) return;
    const watched = el.currentTime;
    if (watched - banked.current >= 30) {
      const delta = watched - banked.current;
      banked.current = watched;
      void bankWatch(delta);
    }
  }

  function onEnded() {
    const el = videoRef.current;
    if (el) {
      const leftover = el.currentTime - banked.current;
      banked.current = el.currentTime;
      void bankWatch(leftover);
    }
    setCompleted(true);
    setTab("related");
  }

  function seekBy(delta: number) {
    const yt = youtubePlayerRef.current;
    if (yt?.getCurrentTime && yt.seekTo) {
      yt.seekTo(Math.max(0, yt.getCurrentTime() + delta), true);
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime + delta);
  }

  function seek(seconds: number) {
    const yt = youtubePlayerRef.current;
    if (yt?.seekTo) {
      yt.seekTo(seconds, true);
      yt.playVideo?.();
      return;
    }
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    void videoRef.current.play();
  }

  async function loadRelatedPyqs(start = false) {
    setPyqLoading(true);
    setPyqError(null);
    const limit = PYQ_LIMIT[exam];
    try {
      const result = await api<RelatedPyq>(`/catalog/contents/${params.contentId}`, {
        method: "POST",
        body: JSON.stringify({ exam, limit, start, action: "related_pyq" }),
      });
      setPyq(result);
      if (start && result.attempt?.id) {
        saveAttempt({
          attempt: result.attempt,
          questions: result.questions as never,
          title: `Lecture PYQ · ${exam.replace("_", " ")}`,
        });
        router.push(`/attempts/${result.attempt.id}`);
      }
    } catch (err) {
      setPyq(null);
      setPyqError(err instanceof Error ? err.message : "Could not load related PYQs");
    } finally {
      setPyqLoading(false);
      setStarting(false);
    }
  }

  async function startPyq() {
    setStarting(true);
    await loadRelatedPyqs(true);
  }

  const examLabel = {
    jee_main: "JEE Mains (10)",
    neet: "NEET (10)",
    jee_adv: "Advanced (5)",
  } as const;

  return (
    <Shell>
      <Breadcrumbs
        items={[
          { href: "/top-teachers", label: "Top Teachers" },
          teacherId ? { href: `/top-teachers/${teacherId}`, label: "Teacher" } : { label: "Lecture" },
          { label: content?.title || "Player" },
        ]}
      />

      {loading && !content ? <LoadingBlock label="Opening lecture…" /> : null}
      {error && !content ? <p className="mb-4 text-sm text-red-300">{error.message}</p> : null}
      {!loading && !content ? (
        <EmptyState title="Lecture not found" body="This lecture is not published yet, or the link is stale." />
      ) : null}

      {content ? (
        <>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
            {content.is_free_preview ? (
              <span className="rounded-full border border-axiom/40 px-3 py-1 text-xs text-axiom">Preview</span>
            ) : null}
          </div>

          <div className="surface overflow-hidden rounded-2xl">
            {embedSrc ? (
              <iframe
                ref={youtubeFrameRef}
                id="axiom-lecture-player"
                title={content.title}
                src={embedSrc}
                className="aspect-video w-full bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : youtubeUrl ? (
              <div className="aspect-video w-full bg-black" />
            ) : playUrl ? (
              <video
                ref={videoRef}
                className="aspect-video w-full bg-black"
                src={playUrl}
                controls
                onTimeUpdate={onTime}
                onEnded={onEnded}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-zinc-950 text-zinc-500">
                Signed URL appears here when the lecture file is attached.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-4 py-3">
              <button type="button" className="btn-ghost h-9 px-3 text-sm" onClick={() => seekBy(-10)}>
                −10s
              </button>
              <button type="button" className="btn-ghost h-9 px-3 text-sm" onClick={() => seekBy(10)}>
                +10s
              </button>
              <div className="ml-auto flex items-center gap-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`h-8 rounded-full px-3 text-xs ${speed === s ? "bg-axiom text-black" : "text-zinc-400"}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Pill active={tab === "timeline"} onClick={() => setTab("timeline")}>
              Timeline
            </Pill>
            <Pill active={tab === "notes"} onClick={() => setTab("notes")}>
              Notes
            </Pill>
            <Pill active={tab === "related"} onClick={() => setTab("related")}>
              Related Q’s
            </Pill>
          </div>

          <div className="surface mt-4 rounded-2xl p-5">
            {tab === "timeline" ? (
              cues.length ? (
                <div className="space-y-2">
                  {cues.map((cue, i) => (
                    <button
                      key={`${cue.label}-${i}`}
                      type="button"
                      onClick={() => seek(cue.seconds)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-zinc-900"
                    >
                      <span>{cue.label}</span>
                      <span className="text-sm text-zinc-500">
                        {Math.floor(cue.seconds / 60)}:{String(cue.seconds % 60).padStart(2, "0")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No timeline markers on this lecture yet.</p>
              )
            ) : null}
            {tab === "notes" ? (
              <div className="prose prose-invert max-w-none text-zinc-300">
                {content.description || "No lecture notes attached."}
              </div>
            ) : null}
            {tab === "related" ? <RelatedPanel /> : null}
          </div>

          {completed ? (
            <div className="mt-8 rounded-2xl border border-axiom/50 bg-axiom/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">Lecture complete</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Bridge into PYQs</h2>
              <p className="mt-2 text-sm text-zinc-300">
                JEE Mains (10) · NEET (10) · Advanced (5). Start opens the attempt player.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(examLabel) as Array<keyof typeof examLabel>).map((opt) => (
                  <Pill key={opt} active={exam === opt} onClick={() => setExam(opt)}>
                    {examLabel[opt]}
                  </Pill>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" disabled={starting} onClick={() => void startPyq()} className="btn-primary h-10 px-5 text-sm">
                  {starting ? "Opening…" : "Start PYQ"}
                </button>
                {nextLecture && teacherId && content.chapter_id ? (
                  <Link
                    href={`/watch/${nextLecture.id}?teacher=${teacherId}&chapter=${content.chapter_id}`}
                    className="btn-ghost h-10 px-5 text-sm"
                  >
                    Skip to next lecture
                  </Link>
                ) : (
                  <button type="button" className="btn-ghost h-10 px-5 text-sm" onClick={() => setCompleted(false)}>
                    Skip to next lecture
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {content.chapter_id && teacherId ? (
            <p className="mt-6 text-sm">
              <Link
                href={`/top-teachers/${teacherId}/chapters/${content.chapter_id}`}
                className="text-axiom hover:underline"
              >
                ← Back to chapter modules
              </Link>
            </p>
          ) : null}
        </>
      ) : null}
    </Shell>
  );

  function RelatedPanel() {
    return (
      <div>
        <p className="text-sm text-zinc-300">
          Test your understanding by solving Top PYQs related strictly to the topics covered in this lecture.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(Object.keys(examLabel) as Array<keyof typeof examLabel>).map((opt) => (
            <Pill key={opt} active={exam === opt} onClick={() => setExam(opt)}>
              {examLabel[opt]}
            </Pill>
          ))}
          <button
            type="button"
            onClick={() => void loadRelatedPyqs(false)}
            disabled={pyqLoading}
            className="btn-primary h-9 px-4 text-sm disabled:opacity-60"
          >
            {pyqLoading ? "Loading…" : "Load related Q’s"}
          </button>
          <button type="button" onClick={() => void startPyq()} className="btn-ghost h-9 px-4 text-sm">
            Start PYQ
          </button>
        </div>
        {pyqError ? <p className="mt-3 text-sm text-red-300">{pyqError}</p> : null}
        {pyq ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-zinc-400">{pyq.prompt}</p>
            {pyq.questions.length === 0 ? (
              <EmptyState title="No related PYQs found for this chapter yet" />
            ) : (
              pyq.questions.map((q, i) => (
                <div key={q.id} className="rounded-xl bg-black/40 px-4 py-3">
                  <p className="text-xs text-axiom">
                    Q{i + 1} · {q.exam} {q.year || ""} · {q.difficulty}
                  </p>
                  <p className="mt-1 text-sm">{q.stem}</p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  }
}

export default function LecturePlayerPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <LecturePlayerInner />
    </Suspense>
  );
}
