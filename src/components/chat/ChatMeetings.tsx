"use client";

import { FormEvent, useState } from "react";
import { createMeeting } from "@/lib/chat-api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ChatMeetings({
  conversationId,
  memberRole,
  onCreated,
}: {
  conversationId: string;
  memberRole: string;
  onCreated: () => void;
}) {
  const mentor = memberRole === "mentor" || memberRole === "admin";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Weekly doubt session");
  const [weekday, setWeekday] = useState(6);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(45);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createMeeting(conversationId, {
        title: title.trim(),
        weekday,
        start_time: startTime.slice(0, 5),
        duration_minutes: duration,
      });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the meeting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shrink-0 border-b border-line px-4 py-2">
      <button type="button" className="btn-ghost h-9 px-3 text-sm" onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : mentor ? "Schedule meeting" : "Request meeting"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {open ? (
        <form onSubmit={onCreate} className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Meeting title"
            className="h-10 rounded-xl border border-line bg-transparent px-3 text-sm text-ink outline-none focus:border-axiom sm:col-span-2"
          />
          <select
            value={weekday}
            onChange={(event) => setWeekday(Number(event.target.value))}
            className="h-10 rounded-xl border border-line bg-card px-3 text-sm text-ink"
          >
            {DAYS.map((day, index) => (
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
          <button type="submit" disabled={saving || title.trim().length < 2} className="btn-primary h-10 text-sm">
            {saving ? "Saving…" : mentor ? "Schedule" : "Request"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
