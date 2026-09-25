"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { onAuthChange, refreshSession, updateProfile, type AxiomUser } from "@/lib/auth";
import { PageHeader, Shell } from "@/components/ui";
import {
  CLASS_LEVELS,
  EXAM_INTEREST_LABELS,
  EXAM_INTERESTS,
  classLabel,
  examTrackFromInterests,
  interestsFromTargetExam,
  isClassLevel,
  parseExamInterests,
  targetExamFromInterests,
  type ClassLevel,
  type ExamInterest,
} from "@/lib/student-profile";

type Notice = { id?: string; title?: string; body?: string; read?: boolean; is_read?: boolean };

export default function SettingsPage() {
  const [user, setUser] = useState<AxiomUser | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [classLevel, setClassLevel] = useState<ClassLevel>("12");
  const [examInterests, setExamInterests] = useState<ExamInterest[]>(["jee"]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [consistency, setConsistency] = useState<string | null>(null);
  const [coins, setCoins] = useState<string | null>(null);

  useEffect(() => onAuthChange(setUser), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await refreshSession();
      if (cancelled) return;
      setReady(true);
      if (!session || !getAccessToken()) return;
      setName(session.name);
      setEmail(session.email);
      try {
        const me = await api<Record<string, unknown>>("/api/me");
        const profile = (me.user || me.profile || me) as Record<string, unknown>;
        if (typeof profile.phone === "string") setPhone(profile.phone);
        if (isClassLevel(profile.class_level)) setClassLevel(profile.class_level);
        const interests = parseExamInterests(profile.exam_interests);
        if (interests.length) setExamInterests(interests);
        else if (typeof profile.target_exam === "string") setExamInterests(interestsFromTargetExam(profile.target_exam));
        else if (profile.exam_track === "jee" || profile.exam_track === "neet" || profile.exam_track === "both") {
          setExamInterests(
            profile.exam_track === "both" ? ["jee", "neet"] : [profile.exam_track],
          );
        }
        if (typeof profile.full_name === "string" && profile.full_name) setName(profile.full_name);
        if (typeof profile.email === "string" && profile.email) setEmail(profile.email);
      } catch {
        /* profile fields stay at the session values */
      }
      const [noteRes, consistencyRes, coinRes] = await Promise.allSettled([
        api<unknown>("/api/notifications"),
        api<unknown>("/api/consistency/status"),
        api<unknown>("/api/coins"),
      ]);
      if (cancelled) return;
      if (noteRes.status === "fulfilled") setNotices(readNotices(noteRes.value));
      if (consistencyRes.status === "fulfilled") setConsistency(readSummary(consistencyRes.value));
      if (coinRes.status === "fulfilled") setCoins(readSummary(coinRes.value));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    if (examInterests.length === 0) {
      setError("Pick at least one exam interest.");
      setSaving(false);
      return;
    }
    const { user: next, error: saveError } = await updateProfile({
      full_name: name,
      name,
      email,
      phone,
      class_level: classLevel,
      exam_interests: examInterests,
      exam_track: examTrackFromInterests(examInterests),
      target_exam: targetExamFromInterests(examInterests),
    });
    setSaving(false);
    if (saveError || !next) {
      setError(saveError || "Could not save settings.");
      return;
    }
    setUser(next);
    setMessage("Saved to your Axiom Prep account.");
  };

  const markRead = async (notice: Notice) => {
    if (!notice.id) return;
    try {
      await api("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id: notice.id, read: true, is_read: true }),
      });
      setNotices((current) => current.map((item) => (item.id === notice.id ? { ...item, read: true } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that notification.");
    }
  };

  if (!ready) {
    return (
      <Shell>
        <p className="text-sm text-muted">Loading your account…</p>
      </Shell>
    );
  }

  if (!user || !getAccessToken()) {
    return (
      <Shell>
        <PageHeader eyebrow="Account" title="Settings" subtitle="Sign in with the Axiom Prep API before changing your profile." />
        <Link href="/login" className="btn-primary h-11 px-5 text-sm">
          Login
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Update the name, email, phone, class, and exam interest stored on your Axiom Prep account."
      />
      <form onSubmit={save} className="surface max-w-xl rounded-2xl p-6 sm:p-8">
        <label className="block text-sm text-muted">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Phone
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            className="mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Class
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
            className="mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none"
          >
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {classLabel(level)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="mt-4">
          <legend className="text-sm text-muted">Exam interest</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAM_INTERESTS.map((interest) => {
              const active = examInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() =>
                    setExamInterests((current) =>
                      current.includes(interest)
                        ? current.filter((item) => item !== interest)
                        : [...current, interest],
                    )
                  }
                  className={`h-10 rounded-full px-4 text-sm ${
                    active ? "bg-axiom text-black" : "border border-line text-muted hover:text-ink"
                  }`}
                >
                  {EXAM_INTEREST_LABELS[interest]}
                </button>
              );
            })}
          </div>
        </fieldset>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-axiom">{message}</p> : null}
        <button type="submit" disabled={saving} className="btn-primary mt-6 h-11 px-5 text-sm disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Consistency</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{consistency || "No streak yet."}</p>
          {coins ? <p className="mt-3 text-sm text-muted">Coins · {coins}</p> : null}
        </section>
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Community</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">Doubt-solving and peer discussion live on Discord.</p>
          <Link href="/coming-soon" className="mt-4 inline-block text-sm text-axiom">
            Open Discord
          </Link>
        </section>
        <section className="surface rounded-2xl p-6 md:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-ink">Notifications</h2>
          {notices.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Nothing waiting.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notices.map((notice, index) => (
                <li key={notice.id || index} className="flex items-start justify-between gap-4 rounded-xl border border-line px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">{notice.title || notice.body || "Notification"}</p>
                    {notice.title && notice.body ? <p className="mt-1 text-xs text-muted">{notice.body}</p> : null}
                  </div>
                  {notice.read || notice.is_read ? (
                    <span className="text-xs text-muted">Read</span>
                  ) : (
                    <button type="button" onClick={() => void markRead(notice)} className="text-xs text-axiom">
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}

function readNotices(value: unknown): Notice[] {
  const root = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const list = Array.isArray(value) ? value : root.notifications || root.items;
  if (!Array.isArray(list)) return [];
  return list.filter((item) => item && typeof item === "object") as Notice[];
}

function readSummary(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.status === "string") return record.status;
  if (typeof record.streak === "number") return `${record.streak} day streak`;
  const gold = record.gold ?? record.gold_coins;
  const silver = record.silver ?? record.silver_coins;
  if (typeof gold === "number" || typeof silver === "number") {
    return `${Number(gold || 0).toLocaleString()} gold · ${Number(silver || 0).toLocaleString()} silver`;
  }
  return null;
}
