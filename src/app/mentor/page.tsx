"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageLoader } from "@/components/BrandLoader";
import { Shell } from "@/components/ui";
import {
  createMeeting,
  getMentorDesk,
  heartbeatPresence,
  setMentorAvailability,
  type MentorDesk,
} from "@/lib/chat-api";
import { meetingWindow } from "@/lib/meeting-time";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK = [1, 2, 3, 4, 5, 6, 0];

function chatPreview(value: string) {
  const text = value.replace(/^\[\[meet:[0-9a-f-]{36}\]\]/i, "").trim();
  return text || "No messages yet";
}

function clock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function MentorDeskPage() {
  const [desk, setDesk] = useState<MentorDesk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [title, setTitle] = useState("Weekly doubt session");
  const [weekday, setWeekday] = useState(6);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(45);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [joinNote, setJoinNote] = useState<string | null>(null);

  const load = () =>
    getMentorDesk()
      .then((data) => {
        setDesk(data);
        setAvailable(data.mentor.availability !== "offline");
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not open the mentor desk."));

  useEffect(() => {
    let alive = true;
    load().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!available) return;
    void heartbeatPresence();
    const tick = window.setInterval(() => void heartbeatPresence(), 45000);
    return () => window.clearInterval(tick);
  }, [available]);

  const today = new Date().getDay();
  const waiting = desk?.students.filter((student) => student.unread) || [];
  const upcoming = useMemo(() => {
    return (desk?.meetings || [])
      .map((meeting) => ({
        meeting,
        window: meetingWindow(meeting.weekday, meeting.start_time, meeting.duration_minutes),
      }))
      .sort((a, b) => a.window.start.getTime() - b.window.start.getTime());
  }, [desk]);
  const next = upcoming[0] || null;

  async function toggleAvailability() {
    const nextValue = available ? "offline" : "available";
    setAvailable(nextValue === "available");
    try {
      await setMentorAvailability(nextValue);
    } catch (err) {
      setAvailable(nextValue !== "available");
      setError(err instanceof Error ? err.message : "Could not update availability.");
    }
  }

  async function schedule(event: FormEvent) {
    event.preventDefault();
    const conversationId = desk?.students[0]?.conversation_id;
    if (!conversationId) {
      setFormError("A student has to open your chat before you can schedule.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createMeeting(conversationId, {
        title: title.trim(),
        weekday,
        start_time: startTime.slice(0, 5),
        duration_minutes: duration,
      });
      setScheduling(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not schedule the meeting.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <PageLoader label="Mentor desk" />
      </Shell>
    );
  }

  if (!desk) {
    return (
      <Shell>
        <p className="text-sm text-red-300">{error || "This screen is for mentor accounts."}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-lg italic text-axiom">Mentor desk</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ink">{desk.mentor.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">{desk.mentor.role_label || desk.mentor.institute}</p>
        </div>
        <button type="button" onClick={() => void toggleAvailability()} className="btn-ghost h-10 px-4 text-sm">
          {available ? "Visible as available" : "Set as away"}
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Students</p>
          <p className="mt-2 font-display text-3xl text-ink">{desk.students.length}</p>
        </article>
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Waiting on you</p>
          <p className="mt-2 font-display text-3xl text-ink">{waiting.length}</p>
        </article>
        <article className="surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Next session</p>
          <p className="mt-2 font-display text-xl text-ink">{next ? next.window.label : "Nothing scheduled"}</p>
          {next ? <p className="mt-1 text-xs text-zinc-400">{next.meeting.with}</p> : null}
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">Student chats</h2>
            <button type="button" className="text-sm text-axiom" onClick={() => setScheduling((value) => !value)}>
              {scheduling ? "Close" : "Schedule"}
            </button>
          </div>
          {scheduling ? (
            <form onSubmit={schedule} className="mt-4 grid gap-2">
              <p className="text-xs text-zinc-400">This meeting is sent into every student chat.</p>
              {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 rounded-xl border border-line bg-transparent px-3 text-sm text-ink outline-none focus:border-axiom"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  value={weekday}
                  onChange={(event) => setWeekday(Number(event.target.value))}
                  className="h-10 rounded-xl border border-line bg-card px-3 text-sm text-ink"
                >
                  {DAY_NAMES.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="h-10 rounded-xl border border-line bg-transparent px-3 text-sm text-ink"
                />
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="h-10 rounded-xl border border-line bg-card px-3 text-sm text-ink"
                >
                  {[30, 45, 60, 90].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={saving || title.trim().length < 2} className="btn-primary h-10 text-sm">
                {saving ? "Saving…" : "Send to students"}
              </button>
            </form>
          ) : null}
          <div className="mt-4 space-y-2">
            {desk.students.length === 0 ? (
              <p className="rounded-xl border border-line px-4 py-6 text-sm text-zinc-400">
                No student chats yet. They appear here after a student messages you.
              </p>
            ) : (
              desk.students.map((student) => (
                <Link
                  key={student.conversation_id}
                  href={`/mentor-inbox/${student.conversation_id}`}
                  className="block rounded-xl border border-line px-4 py-3 hover:border-axiom/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink">{student.name}</p>
                      <p className="mt-1 text-xs text-zinc-400">{chatPreview(student.preview)}</p>
                    </div>
                    {student.unread ? (
                      <span className="rounded-full bg-axiom px-2 py-1 text-[11px] text-black">New</span>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="surface rounded-2xl p-5">
          <h2 className="font-display text-2xl text-ink">When to connect</h2>
          <p className="mt-1 text-sm text-zinc-400">Weekly meetings with your students.</p>
          {joinNote ? <p className="mt-3 text-sm text-axiom">{joinNote}</p> : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {WEEK.map((day) => {
              const items = upcoming.filter((item) => item.meeting.weekday === day);
              const isToday = day === today;
              return (
                <div key={day} className={`rounded-xl border px-3 py-3 ${isToday ? "border-axiom/50" : "border-line"}`}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">
                    {DAY_NAMES[day].slice(0, 3)}
                    {isToday ? " · Today" : ""}
                  </p>
                  {items.length === 0 ? (
                    <p className="mt-3 text-xs text-zinc-500">Free</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {items.map((item) => (
                        <li key={item.meeting.id}>
                          <p className="text-sm text-ink">{clock(item.meeting.start_time)}</p>
                          <p className="text-xs text-zinc-400">
                            {item.meeting.title} · {item.meeting.duration_minutes} min
                          </p>
                          <p className="text-xs text-zinc-500">{item.meeting.with}</p>
                          {item.window.open ? (
                            <Link href={`/meet/${item.meeting.id}`} className="mt-1 inline-block text-xs text-axiom">
                              Join
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="mt-1 text-left text-xs text-axiom"
                              onClick={() => setJoinNote(`Meeting not started. Scheduled time is ${item.window.label}.`)}
                            >
                              Join
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Shell>
  );
}
