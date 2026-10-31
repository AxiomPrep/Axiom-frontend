"use client";

import { FormEvent, useEffect, useState } from "react";
import { createAdminMentorAccount, listAdminMentorAccounts, type AdminMentorAccount } from "@/lib/admin";

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none";

type Issued = { email: string; full_name: string; password: string };

export function MentorDesk({ email }: { email: string }) {
  const [mentors, setMentors] = useState<AdminMentorAccount[]>([]);
  const [fullName, setFullName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institute, setInstitute] = useState("");
  const [examTrack, setExamTrack] = useState<"jee" | "neet" | "both">("both");
  const [tier, setTier] = useState<"a" | "b">("a");
  const [existing, setExisting] = useState(false);
  const [cardId, setCardId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  const load = () =>
    listAdminMentorAccounts(email)
      .then((data) => setMentors(data.mentors))
      .catch((err) => {
        setMentors([]);
        setError(err instanceof Error ? err.message : "Could not load mentor accounts.");
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, [email]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setIssued(null);
    try {
      const created = await createAdminMentorAccount(email, {
        full_name: fullName.trim(),
        email: mentorEmail.trim(),
        password,
        institute: institute.trim(),
        exam_track: examTrack,
        required_tier: tier,
        existing,
        mentor_profile_id: cardId || null,
      });
      setIssued({ email: created.email, full_name: created.full_name, password: created.password });
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create that mentor login.");
    } finally {
      setSaving(false);
    }
  };

  const waiting = mentors.filter((mentor) => !mentor.has_login);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={submit} className="surface rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Mentor login</h2>
        <p className="mt-2 text-sm text-muted">
          Website signups stay students. A login created here is a mentor, and that role does not change.
        </p>
        {error ? <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        {issued ? (
          <div className="mt-4 rounded-xl border border-axiom/30 bg-axiom/10 px-4 py-3 text-sm text-ink">
            <p className="font-medium">Give these details to {issued.full_name}. The role is permanent.</p>
            <p className="mt-2">Email: {issued.email}</p>
            <p>Password: {issued.password}</p>
          </div>
        ) : null}
        <label className="mt-5 block text-sm text-muted">
          Full name
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Email
          <input
            required
            type="email"
            value={mentorEmail}
            onChange={(e) => setMentorEmail(e.target.value)}
            placeholder="name@gmail.com"
            className={fieldClass}
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Password
          <input
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Institute
          <input value={institute} onChange={(e) => setInstitute(e.target.value)} className={fieldClass} />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted">
            Exam
            <select value={examTrack} onChange={(e) => setExamTrack(e.target.value as "jee" | "neet" | "both")} className={fieldClass}>
              <option value="both">JEE and NEET</option>
              <option value="jee">JEE</option>
              <option value="neet">NEET</option>
            </select>
          </label>
          <label className="block text-sm text-muted">
            Chat plan
            <select value={tier} onChange={(e) => setTier(e.target.value as "a" | "b")} className={fieldClass}>
              <option value="a">Gold and above</option>
              <option value="b">Diamond / Platinum</option>
            </select>
          </label>
        </div>
        {waiting.length ? (
          <label className="mt-4 block text-sm text-muted">
            Attach to an existing mentor card
            <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={fieldClass}>
              <option value="">New mentor card</option>
              {waiting.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.full_name}
                  {mentor.institute ? ` · ${mentor.institute}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="mt-4 flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={existing}
            onChange={(e) => setExisting(e.target.checked)}
            className="mt-1"
          />
          <span>This person already has an Axiom account and asked to become a mentor.</span>
        </label>
        <button type="submit" disabled={saving} className="btn-primary mt-5 h-11 px-5 text-sm disabled:opacity-60">
          {saving ? "Saving…" : "Create mentor login"}
        </button>
      </form>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Mentor accounts</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading mentors…</p>
        ) : mentors.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No mentor cards yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mentors.map((mentor) => (
              <li key={mentor.id} className="rounded-xl border border-line px-4 py-3">
                <p className="text-sm text-ink">{mentor.full_name}</p>
                <p className="mt-1 text-xs text-muted">
                  {mentor.institute || "Institute not set"}
                  {mentor.email ? ` · ${mentor.email}` : ""}
                  {mentor.has_login ? " · Mentor login" : " · No login yet"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
