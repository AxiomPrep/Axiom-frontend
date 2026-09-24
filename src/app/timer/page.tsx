"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { readerHref } from "@/lib/reader";
import { notifyTimerChanged, TIMER_EVENT } from "@/lib/study-hub-local";
import { useApi } from "@/lib/use-api";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Pill, Shell } from "@/components/ui";

type Subject = { id: string; name: string; slug: string };
type Session = {
  id: string;
  subject_id: string | null;
  started_at: string;
  duration_sec?: number;
  focus_lock?: boolean;
  status?: string;
  subjects?: { slug?: string; name?: string } | null;
};
type Activity = {
  id: string;
  activity_type: string;
  label: string;
  duration_sec: number;
  created_at: string;
};
type TimerRes = {
  day: string;
  running_session: Session | null;
  subject_totals_sec: Record<string, number>;
  sessions: Session[];
  activities: Activity[];
  focus_lock_note?: string;
};
type Todo = { id: string; title: string; is_done: boolean; day: string };
type TodosRes = {
  day: string;
  todos: Todo[];
  reflection: { incomplete_reason?: string | null } | null;
  yesterday_carryover: { day: string; incomplete: Todo[]; reason: string | null } | null;
};
type NcertBook = {
  id: string;
  title: string;
  class_level: string | null;
  cover_url?: string | null;
  subjects?: { name?: string; slug?: string } | null;
  read_url?: string | null;
};

const SUBJECTS = [
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "mathematics", name: "Mathematics" },
  { slug: "biology", name: "Biology" },
] as const;

function formatClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function StudyHubInner() {
  const search = useSearchParams();
  const router = useRouter();
  const initial = (search.get("tab") as "timer" | "todo" | "ncert") || "timer";
  const [tab, setTab] = useState<"timer" | "todo" | "ncert">(initial);

  function go(next: "timer" | "todo" | "ncert") {
    setTab(next);
    router.replace(next === "timer" ? "/timer" : `/timer?tab=${next}`, { scroll: false });
  }

  return (
    <Shell>
      <Breadcrumbs items={[{ label: "Study Hub" }]} />
      <PageHeader
        eyebrow="Focus"
        title="Timer & Study Hub"
        subtitle="Timers by subject, daily to-dos, and the NCERT books in the same reader as notes."
      />
      <div className="mb-8 flex flex-wrap gap-2">
        <Pill active={tab === "timer"} onClick={() => go("timer")}>
          Timer
        </Pill>
        <Pill active={tab === "todo"} onClick={() => go("todo")}>
          Daily To-Do
        </Pill>
        <Pill active={tab === "ncert"} onClick={() => go("ncert")}>
          NCERT Library
        </Pill>
      </div>
      {tab === "timer" ? <TimerPane /> : null}
      {tab === "todo" ? <TodoPane /> : null}
      {tab === "ncert" ? <NcertPane /> : null}
    </Shell>
  );
}

function TimerPane() {
  const subjectsApi = useApi<{ subjects: Subject[] }>("/catalog/practice/subjects");
  const timerApi = useApi<TimerRes>("/api/timer");
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [focusPref, setFocusPref] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const catalog = (subjectsApi.data?.subjects || []).map((row) => ({
    slug: row.slug,
    name: row.name,
    id: row.id,
  }));

  const running = timerApi.data?.running_session || null;
  const totals = timerApi.data?.subject_totals_sec || {};
  const activities = timerApi.data?.activities || [];

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const reloadTimer = timerApi.reload;
  useEffect(() => {
    const onChange = () => {
      void reloadTimer();
    };
    window.addEventListener(TIMER_EVENT, onChange);
    return () => window.removeEventListener(TIMER_EVENT, onChange);
  }, [reloadTimer]);

  const liveSec = useMemo(() => {
    if (!running?.started_at) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(running.started_at).getTime()) / 1000));
  }, [running, tick]);

  async function start(subjectId: string) {
    setBusy(true);
    setNote(null);
    try {
      if (running) await api("/api/timer", { method: "PATCH", body: JSON.stringify({ action: "stop" }) });
      await api("/api/timer", {
        method: "POST",
        body: JSON.stringify({
          subject_id: subjectId,
          focus_lock: focusPref,
        }),
      });
      await timerApi.reload();
      notifyTimerChanged();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not start timer");
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    try {
      await api("/api/timer", { method: "PATCH", body: JSON.stringify({ action: "stop" }) });
      await timerApi.reload();
      notifyTimerChanged();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not stop");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFocus() {
    const next = !((running?.focus_lock ?? focusPref) as boolean);
    setFocusPref(next);
    if (!running) return;
    try {
      await api("/api/timer", { method: "PATCH", body: JSON.stringify({ action: "toggle_focus" }) });
      await timerApi.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not toggle focus");
    }
  }

  const focusOn = Boolean(running?.focus_lock || focusPref);

  return (
    <div>
      <ApiStatus error={timerApi.error || subjectsApi.error} />
      {timerApi.loading ? <LoadingBlock label="Loading today’s sessions…" /> : null}
      {focusOn ? (
        <div className="mb-6 rounded-2xl border border-axiom/40 bg-axiom/10 px-5 py-4">
          <p className="font-semibold text-axiom">Focus Lock is on</p>
          <p className="mt-1 text-sm text-zinc-400">
            {timerApi.data?.focus_lock_note ||
              "Saved on this session only. It does not block other apps on your computer."}
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">Today by subject</p>
        <button type="button" onClick={() => void toggleFocus()} className="btn-ghost h-9 px-4 text-sm">
          {focusOn ? "Disable Focus Lock" : "Enable Focus Lock"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {catalog.map((sub) => {
          const isRun = running && (running.subject_id === sub.id || running.subjects?.slug === sub.slug);
          const base = totals[sub.slug] || totals[sub.id] || 0;
          const shown = base + (isRun ? liveSec : 0);
          return (
            <div key={sub.slug} className="surface rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">{sub.name}</p>
              <p className="mt-3 font-sans text-4xl font-semibold tabular-nums tracking-tight">{formatClock(shown)}</p>
              <div className="mt-4 flex gap-2">
                {isRun ? (
                  <button type="button" disabled={busy} onClick={() => void stop()} className="btn-primary h-9 px-4 text-sm">
                    Stop
                  </button>
                ) : (
                  <button type="button" disabled={busy} onClick={() => void start(sub.id)} className="btn-ghost h-9 px-4 text-sm">
                    Start
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {note ? <p className="mt-4 text-sm text-red-300">{note}</p> : null}

      <h3 className="mt-10 mb-3 text-lg font-semibold">Activity log</h3>
      {activities.length ? (
        <div className="space-y-2">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
              <span>
                <span className="text-axiom">{a.activity_type}</span>
                <span className="text-zinc-400"> · {a.label}</span>
              </span>
              <span className="text-zinc-500">{formatClock(a.duration_sec || 0)}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No activity yet today" body="Lectures, practice, and PYQs log here when you study with a running timer." />
      )}
    </div>
  );
}

function TodoPane() {
  const todosApi = useApi<TodosRes>("/api/todos");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const todos = todosApi.data?.todos ?? [];
  const carry = todosApi.data?.yesterday_carryover;
  const savedReason = todosApi.data?.reflection?.incomplete_reason;

  async function add() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    setNote(null);
    try {
      await api("/api/todos", { method: "POST", body: JSON.stringify({ title: t }) });
      setTitle("");
      await todosApi.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not add that target.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(todo: Todo) {
    try {
      await api("/api/todos", { method: "PATCH", body: JSON.stringify({ id: todo.id, is_done: !todo.is_done }) });
      await todosApi.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not update that target.");
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/todos?id=${id}`, { method: "DELETE" });
      await todosApi.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not delete that target.");
    }
  }

  async function saveReflection() {
    setBusy(true);
    setNote(null);
    try {
      await api("/api/todos", {
        method: "PATCH",
        body: JSON.stringify({ incomplete_reason: reason }),
      });
      await todosApi.reload();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save reflection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ApiStatus error={todosApi.error} />
      {note ? <p className="mb-4 text-sm text-red-300">{note}</p> : null}
      {todosApi.loading ? <LoadingBlock /> : null}

      {carry && (carry.incomplete.length || carry.reason) ? (
        <div className="mb-8 rounded-2xl border border-axiom/35 bg-axiom/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">Yesterday leftover</p>
          <p className="mt-2 text-sm text-zinc-300">
            {carry.reason || "You left a target unfinished. Finish it today or rewrite it."}
          </p>
          <ul className="mt-3 space-y-2">
            {carry.incomplete.map((t) => (
              <li key={t.id} className="text-sm text-ink">
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Today’s free-text target"
          className="h-11 flex-1 rounded-xl border border-line bg-black/40 px-4 text-sm outline-none focus:border-axiom"
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button type="button" disabled={busy} onClick={() => void add()} className="btn-primary h-11 px-5 text-sm">
          Add
        </button>
      </div>

      {todos.length ? (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div key={todo.id} className="surface flex items-center gap-3 rounded-2xl px-4 py-3">
              <button
                type="button"
                onClick={() => void toggle(todo)}
                className={`h-5 w-5 rounded border ${todo.is_done ? "border-axiom bg-axiom" : "border-line"}`}
                aria-label="Toggle complete"
              />
              <p className={`flex-1 text-sm ${todo.is_done ? "text-zinc-500 line-through" : ""}`}>{todo.title}</p>
              <button type="button" className="text-xs text-zinc-500 hover:text-white" onClick={() => void remove(todo.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No targets yet" body="Write what you will finish today. Incomplete items carry forward with last night’s reason." />
      )}

      <div className="surface mt-8 rounded-2xl p-5">
        <p className="font-semibold">Night reflection</p>
        <p className="mt-1 text-sm text-zinc-500">Why couldn’t you complete today’s target?</p>
        <textarea
          value={reason || savedReason || ""}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-xl border border-line bg-black/40 px-4 py-3 text-sm outline-none focus:border-axiom"
        />
        <button type="button" disabled={busy} onClick={() => void saveReflection()} className="btn-primary mt-4 h-9 px-4 text-sm">
          Save reflection
        </button>
      </div>
    </div>
  );
}

function NcertPane() {
  const { data, loading, error } = useApi<{ books: NcertBook[] }>("/catalog/ncert");
  const books = data?.books || [];
  const [klass, setKlass] = useState<"11" | "12">("11");
  const grouped = SUBJECTS.map((s) => ({
    ...s,
    books: books.filter(
      (b) =>
        (b.class_level || "11") === klass &&
        (b.subjects?.slug === s.slug || b.subjects?.name?.toLowerCase() === s.name.toLowerCase())
    ),
  }));

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["11", "12"] as const).map((k) => (
          <Pill key={k} active={klass === k} onClick={() => setKlass(k)}>
            Class {k}
          </Pill>
        ))}
      </div>
      <ApiStatus error={error} />
      {loading ? <LoadingBlock label="Loading shelf…" /> : null}
      <div className="space-y-8">
        {grouped.map((g) => (
          <section key={g.slug}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-axiom">{g.name}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {g.books.map(
                (book) => (
                  <Link
                    key={book.id}
                    href={readerHref({ source: "content", id: book.id, title: book.title, url: book.read_url })}
                    className="surface surface-hover group overflow-hidden rounded-2xl"
                  >
                    <div className="flex aspect-[3/4] items-end bg-gradient-to-br from-[#3a2a14] to-[#120e09] p-4">
                      <p className="font-display text-xl leading-tight text-[#f3d7a4]">{book.title}</p>
                    </div>
                    <p className="px-4 py-3 text-xs text-zinc-500">Class {book.class_level || klass} · Open flipbook</p>
                  </Link>
                )
              )}
            </div>
            {!g.books.length ? <p className="text-sm text-zinc-600">No cover on this shelf yet.</p> : null}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <StudyHubInner />
    </Suspense>
  );
}
