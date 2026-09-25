"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  clearAdminSession,
  createAdminContent,
  createAdminTeacher,
  deleteAdminContent,
  listAdminContents,
  listAdminTeachers,
  readAdminSession,
  requestAdminAccess,
  type AdminContent,
  type AdminSession,
} from "@/lib/admin";
import {
  ADMIN_DESTINATIONS,
  CLASS_OPTIONS,
  EXAM_OPTIONS,
  MODULE_OPTIONS,
  PRACTICE_TIER_OPTIONS,
  QUIZ_TIER_OPTIONS,
  SOURCE_ACCEPT,
  SOURCE_LABELS,
  SUBJECT_OPTIONS,
  TOOL_KIND_OPTIONS,
  YEAR_OPTIONS,
  chaptersFor,
  findDestination,
  findSlot,
  isVideoTeacherModule,
  sourcesForTeacherModule,
  type AdminDestination,
  type AdminSourceKind,
} from "@/lib/admin-destinations";
import { mergeFacultyLists, SEEDED_TEACHERS, teachersForSubject, type AdminTeacher } from "@/data/admin-teachers";
import { facultySlug, teachersFromUploads } from "@/lib/faculty-catalog";
import { Logo } from "@/components/Logo";

const fieldClass =
  "relative z-20 mt-2 h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink focus:border-axiom focus:outline-none";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [email, setEmail] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [contents, setContents] = useState<AdminContent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [destinationId, setDestinationId] = useState(ADMIN_DESTINATIONS[0].id);
  const destination = findDestination(destinationId);
  const [slotId, setSlotId] = useState(destination.slots[0].id);
  const slot = findSlot(destination, slotId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("physics");
  const [classLevel, setClassLevel] = useState("12");
  const [chapter, setChapter] = useState("");
  const [customChapter, setCustomChapter] = useState("");
  const [tier, setTier] = useState("1");
  const [exam, setExam] = useState("jee_main");
  const [year, setYear] = useState("2025");
  const [teacher, setTeacher] = useState("");
  const [customTeacher, setCustomTeacher] = useState("");
  const [teachers, setTeachers] = useState<AdminTeacher[]>(SEEDED_TEACHERS);
  const [moduleKey, setModuleKey] = useState("lectures");
  const [toolKind, setToolKind] = useState("formula_sheet");
  const [quizTier, setQuizTier] = useState("s1");
  const [published, setPublished] = useState(true);
  const [preview, setPreview] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingTeacher, setAddingTeacher] = useState(false);

  const chapterChoices = useMemo(() => chaptersFor(subject, classLevel), [subject, classLevel]);
  const teacherChoices = useMemo(() => teachersForSubject(teachers, subject), [teachers, subject]);
  const activeSources: AdminSourceKind[] =
    destination.id === "top-teachers" ? sourcesForTeacherModule(moduleKey) : slot.sources;
  const fileSources = activeSources.filter((kind) => kind !== "youtube" && kind !== "pdf_link");
  const wantsYoutube = activeSources.includes("youtube");
  const wantsPdfLink = activeSources.includes("pdf") || activeSources.includes("pdf_link");
  const accept = fileSources.map((kind) => SOURCE_ACCEPT[kind]).filter(Boolean).join(",");
  const hideSlotPicker = destination.id === "top-teachers" || destination.slots.length === 1;

  useEffect(() => {
    void (async () => {
      try {
        const current = await readAdminSession();
        if (current && "email" in current && current.email) {
          setSession(current as AdminSession);
          const listed = await listAdminContents(current.email).catch(() => ({ contents: [] as AdminContent[] }));
          setContents(listed.contents);
          const faculty = await listAdminTeachers().catch(() => ({ teachers: [] as AdminTeacher[] }));
          setTeachers(mergeFacultyLists(SEEDED_TEACHERS, [...faculty.teachers, ...teachersFromUploads(listed.contents)]));
        }
      } catch {
        setSession(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    setSlotId(destination.slots[0].id);
    setYoutubeUrl("");
    setPdfUrl("");
    setFile(null);
    if (chapterChoices[0] && !chapterChoices.some((item) => item.id === chapter)) {
      setChapter(chapterChoices[0].id);
    }
  }, [destination.id]);

  useEffect(() => {
    if (chapterChoices[0] && !chapterChoices.some((item) => item.id === chapter) && chapter !== "__custom") {
      setChapter(chapterChoices[0].id);
    }
  }, [chapterChoices, chapter]);

  useEffect(() => {
    if (destination.id !== "top-teachers" || teacher === "__custom" || !teacher) return;
    const selected = teachers.find((item) => item.id === teacher || item.name === teacher);
    if (selected?.subject) setSubject(selected.subject);
  }, [teacher]);

  useEffect(() => {
    if (destination.id !== "top-teachers") return;
    setYoutubeUrl("");
    setPdfUrl("");
    setFile(null);
  }, [moduleKey, destination.id]);

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setGateLoading(true);
    try {
      const next = await requestAdminAccess(email);
      setSession(next);
      const listed = await listAdminContents(next.email);
      setContents(listed.contents);
      const faculty = await listAdminTeachers().catch(() => ({ teachers: [] as AdminTeacher[] }));
      setTeachers(mergeFacultyLists(SEEDED_TEACHERS, [...faculty.teachers, ...teachersFromUploads(listed.contents)]));
    } catch (err) {
      setGateError(err instanceof Error ? err.message : "This email is not seeded for admin access.");
    } finally {
      setGateLoading(false);
    }
  };

  const leave = async () => {
    await clearAdminSession().catch(() => {});
    setSession(null);
    setEmail("");
    setContents([]);
  };

  const resolvedChapter =
    chapter === "__custom" ? customChapter.trim() : chapterChoices.find((item) => item.id === chapter)?.label || chapter;
  const resolvedTeacher =
    teacher === "__custom"
      ? customTeacher.trim()
      : teacherChoices.find((item) => item.id === teacher || item.name === teacher)?.name || teacher;

  const rememberTeacher = (name: string, subjectId = subject) => {
    const row: AdminTeacher = { id: facultySlug(name), name, subject: subjectId, listed: true };
    setTeachers((current) => mergeFacultyLists(SEEDED_TEACHERS, [...current, row]));
    setTeacher(row.id);
    setCustomTeacher("");
    return row;
  };

  const addTeacherToList = async () => {
    const name = customTeacher.trim();
    if (!name) return;
    setAddingTeacher(true);
    setError(null);
    rememberTeacher(name, subject);
    try {
      await createAdminTeacher(name, subject);
      setNotice(`“${name}” is now in the teachers list.`);
    } catch {
      setNotice(`“${name}” is in this list. Publish a lecture so the student site keeps them.`);
    } finally {
      setAddingTeacher(false);
    }
  };

  const publish = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (!session?.email) throw new Error("Admin session required.");
      if (!youtubeUrl && !pdfUrl && !file) {
        throw new Error("Add a YouTube or PDF link, or upload a PDF / Excel file.");
      }
      const { content } = await createAdminContent(
        {
          title,
          description,
          destination_id: destination.id,
          slot_id: slot.id,
          youtube_url: youtubeUrl,
          pdf_url: pdfUrl,
          file,
          subject,
          class_level: classLevel,
          chapter: resolvedChapter,
          teacher: resolvedTeacher,
          teacher_id: teacher === "__custom" ? facultySlug(customTeacher) : teacher,
          module: moduleKey,
          tool_kind: destination.fields.toolKind ? toolKind : "",
          exam: destination.fields.exam ? exam : "",
          year: destination.fields.year ? year : "",
          tier: destination.fields.tier ? tier : "",
          quiz_tier: destination.fields.quizTier ? quizTier : "",
          is_published: published ? "true" : "false",
          is_free_preview: preview || Boolean(file) ? "true" : "false",
        },
        session.email,
      );
      setContents((current) => [content, ...current]);
      if (resolvedTeacher) rememberTeacher(resolvedTeacher, subject);
      const faculty = await listAdminTeachers().catch(() => ({ teachers: [] as AdminTeacher[] }));
      setTeachers(
        mergeFacultyLists(SEEDED_TEACHERS, [
          ...faculty.teachers,
          ...teachersFromUploads([content]),
          ...(resolvedTeacher ? [{ id: facultySlug(resolvedTeacher), name: resolvedTeacher, subject, listed: true }] : []),
        ]),
      );
      if (resolvedTeacher) setTeacher(facultySlug(resolvedTeacher));
      setTitle("");
      setDescription("");
      setYoutubeUrl("");
      setPdfUrl("");
      setFile(null);
      if (!content.live_id) {
        throw new Error("Render did not save that upload. Nothing was kept on this computer.");
      }
      setNotice(content.extracted_summary || `Saved to ${destination.title} on the live student site.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that upload.");
    } finally {
      setSaving(false);
    }
  };

  const visibleUploads = contents.filter((item) => {
    if ((item.description || "").includes("Sample lecture")) return false;
    if (item.title === "Lec 1: Introduction") return false;
    return item.destination_id === destination.id;
  });

  const removeUpload = async (item: AdminContent) => {
    const label = item.title || "this upload";
    if (!window.confirm(`Delete “${label}” from history and from the student site?`)) return;
    setError(null);
    setNotice(null);
    setRemovingId(item.id);
    try {
      await deleteAdminContent(item.live_id || item.id, {
        title: item.title,
        destination_id: item.destination_id,
        file_name: item.file_name,
      });
      const listed = session?.email ? await listAdminContents(session.email).catch(() => null) : null;
      if (listed) setContents(listed.contents);
      else {
        const title = item.title.trim().toLowerCase();
        setContents((current) =>
          current.filter((row) => {
            if (row.id === item.id || row.live_id === item.id || row.live_id === item.live_id) return false;
            return row.title.trim().toLowerCase() !== title;
          }),
        );
      }
      setNotice(`Deleted “${label}” from history and the student pages.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that upload.");
    } finally {
      setRemovingId(null);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Checking seeded admin access…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <Logo variant="mark" />
        </div>
        <p className="text-center font-display text-lg italic text-axiom">Seeded access only</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold text-ink">Admin desk</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          Enter an email from the admin seed file. Student signup and login cannot open this screen.
        </p>
        <form onSubmit={unlock} className="surface mt-8 rounded-2xl p-6">
          {gateError ? (
            <p className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{gateError}</p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted">Seeded admin email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@axiomprep.com"
              className="h-11 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 text-sm text-ink placeholder:text-zinc-500 focus:border-axiom focus:outline-none"
            />
          </label>
          <button type="submit" disabled={gateLoading} className="btn-primary mt-5 h-11 w-full text-sm disabled:opacity-60">
            {gateLoading ? "Checking seed…" : "Enter admin"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo variant="mark" />
          <div>
            <p className="font-display text-sm italic text-axiom">Axiom Prep admin</p>
            <p className="text-sm text-muted">{session.email}</p>
          </div>
        </div>
        <button type="button" onClick={() => void leave()} className="btn-ghost h-10 px-4 text-sm">
          Leave admin
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={publish} className="surface rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Where should this go?</h2>
          <p className="mt-2 text-sm text-muted">Pick the student page first. The form then shows only what that page needs.</p>

          <label className="mt-5 block text-sm text-muted">
            Student page
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className={fieldClass}
            >
              {groupedDestinations().map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {item.href}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-2xl border border-axiom/25 bg-axiom/[0.06] px-4 py-3 text-sm">
            <p className="font-medium text-ink">{destination.what}</p>
            <p className="mt-2 text-muted">{destination.where}</p>
          </div>

          {hideSlotPicker ? null : (
            <label className="mt-5 block text-sm text-muted">
              What to upload
              <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className={fieldClass}>
                {destination.slots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className={`${hideSlotPicker ? "mt-5" : "mt-2"} text-xs leading-relaxed text-zinc-500`}>
            {destination.id === "top-teachers"
              ? isVideoTeacherModule(moduleKey)
                ? "This module takes a YouTube link only."
                : "This module takes a PDF file or a PDF link."
              : slot.hint}
          </p>
          <p className="mt-1 text-xs text-muted">
            Allowed: {activeSources.map((kind) => SOURCE_LABELS[kind]).join(", ")}
          </p>
          {destination.id === "top-teachers" ? (
            <p className="mt-3 rounded-xl border border-line px-3 py-2 text-xs leading-relaxed text-zinc-400">
              Related Q’s on the lecture are built automatically from PYQ Bank questions for this chapter. Do not
              upload them on the teacher. Add those questions under PYQ Bank as Excel or a question PDF.
            </p>
          ) : null}

          <PlacementFields
            destination={destination}
            subject={subject}
            setSubject={setSubject}
            classLevel={classLevel}
            setClassLevel={setClassLevel}
            chapter={chapter}
            setChapter={setChapter}
            customChapter={customChapter}
            setCustomChapter={setCustomChapter}
            chapterChoices={chapterChoices}
            tier={tier}
            setTier={setTier}
            exam={exam}
            setExam={setExam}
            year={year}
            setYear={setYear}
            teacher={teacher}
            setTeacher={setTeacher}
            customTeacher={customTeacher}
            setCustomTeacher={setCustomTeacher}
            addingTeacher={addingTeacher}
            onAddTeacher={() => void addTeacherToList()}
            teacherChoices={teacherChoices}
            moduleKey={moduleKey}
            setModuleKey={setModuleKey}
            toolKind={toolKind}
            setToolKind={setToolKind}
            quizTier={quizTier}
            setQuizTier={setQuizTier}
          />

          <label className="mt-5 block text-sm text-muted">
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
          </label>

          {wantsYoutube ? (
            <label className="mt-4 block text-sm text-muted">
              YouTube link
              <input
                type="url"
                required={!file && !pdfUrl && wantsYoutube && !wantsPdfLink && fileSources.length === 0}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v="
                className={`${fieldClass} placeholder:text-zinc-500`}
              />
            </label>
          ) : null}

          {wantsPdfLink ? (
            <label className="mt-4 block text-sm text-muted">
              PDF link
              <input
                type="url"
                required={!file && !youtubeUrl && wantsPdfLink && fileSources.length === 0}
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://…/notes.pdf"
                className={`${fieldClass} placeholder:text-zinc-500`}
              />
            </label>
          ) : null}

          {fileSources.length ? (
            <label className="mt-4 block text-sm text-muted">
              {fileSources.includes("pdf") && fileSources.includes("excel")
                ? "PDF or Excel file"
                : fileSources.includes("pdf")
                  ? "PDF file"
                  : fileSources.includes("excel")
                    ? "Excel file"
                    : "Document"}
              <input
                type="file"
                accept={accept}
                required={!youtubeUrl && !pdfUrl && fileSources.length > 0 && !wantsYoutube && !wantsPdfLink}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-axiom file:px-4 file:py-2 file:text-sm file:text-black"
              />
              <span className="mt-1 block text-xs text-zinc-500">
                {file
                  ? file.name
                  : fileSources.includes("pdf") && wantsPdfLink
                    ? "Upload a PDF here, or paste a PDF link above. Max 15 MB."
                    : fileSources.includes("excel")
                      ? "Excel / CSV this slot accepts. Max 15 MB."
                      : "File this slot accepts. Max 15 MB."}
              </span>
            </label>
          ) : null}

          <label className="mt-4 block text-sm text-muted">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-line bg-[color:var(--bg)] px-3 py-2 text-sm text-ink focus:border-axiom focus:outline-none"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Published
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              Free preview
            </label>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          {notice ? <p className="mt-4 text-sm text-axiom">{notice}</p> : null}

          <button type="submit" disabled={saving} className="btn-primary mt-6 h-11 px-5 text-sm disabled:opacity-60">
            {saving ? "Saving…" : `Publish to ${destination.title}`}
          </button>
        </form>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-ink">{destination.title}</h2>
          <p className="mt-2 text-sm text-muted">
            {visibleUploads.length} upload{visibleUploads.length === 1 ? "" : "s"} aimed at {destination.href}
          </p>
          {visibleUploads.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">Nothing for this page yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {visibleUploads.map((item) => (
                <li key={item.id} className="rounded-xl border border-line px-4 py-3">
                  <p className="text-sm text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.slot_label || item.type}
                    {item.source_kind ? ` · ${SOURCE_LABELS[item.source_kind]}` : ""}
                    {item.subject ? ` · ${item.subject}` : ""}
                    {item.class_level ? ` · Class ${item.class_level}` : ""}
                    {item.chapter ? ` · ${item.chapter}` : ""}
                    {item.tool_kind
                      ? ` · ${TOOL_KIND_OPTIONS.find((kind) => kind.id === item.tool_kind)?.label || item.tool_kind}`
                      : ""}
                    {item.tier ? ` · Tier ${item.tier}` : ""}
                    {item.extracted_kind === "questions"
                      ? ` · ${item.extracted_questions?.length || 0} questions`
                      : item.extracted_kind === "notes"
                        ? " · book / notes"
                        : ""}
                  </p>
                  {item.file_name ? <p className="mt-1 text-xs text-zinc-500">{item.file_name}</p> : null}
                  {item.external_url ? (
                    <a href={item.external_url} className="mt-1 block text-xs text-axiom" target="_blank" rel="noreferrer">
                      {item.source_kind === "youtube" ? "Open YouTube" : "Open PDF link"}
                    </a>
                  ) : null}
                  {item.storage_path ? (
                    <a href={item.storage_path} className="mt-1 block text-xs text-axiom">
                      Open file
                    </a>
                  ) : null}
                  <button
                    type="button"
                    disabled={removingId === item.id}
                    className="mt-2 text-xs text-red-300 hover:underline disabled:opacity-50"
                    onClick={() => void removeUpload(item)}
                  >
                    {removingId === item.id ? "Deleting…" : "Delete from site"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function groupedDestinations() {
  const groups: { name: string; items: AdminDestination[] }[] = [];
  for (const item of ADMIN_DESTINATIONS) {
    const existing = groups.find((group) => group.name === item.group);
    if (existing) existing.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }
  return groups;
}

function PlacementFields({
  destination,
  subject,
  setSubject,
  classLevel,
  setClassLevel,
  chapter,
  setChapter,
  customChapter,
  setCustomChapter,
  chapterChoices,
  tier,
  setTier,
  exam,
  setExam,
  year,
  setYear,
  teacher,
  setTeacher,
  customTeacher,
  setCustomTeacher,
  addingTeacher,
  onAddTeacher,
  teacherChoices,
  moduleKey,
  setModuleKey,
  toolKind,
  setToolKind,
  quizTier,
  setQuizTier,
}: {
  destination: AdminDestination;
  subject: string;
  setSubject: (value: string) => void;
  classLevel: string;
  setClassLevel: (value: string) => void;
  chapter: string;
  setChapter: (value: string) => void;
  customChapter: string;
  setCustomChapter: (value: string) => void;
  chapterChoices: { id: string; label: string }[];
  tier: string;
  setTier: (value: string) => void;
  exam: string;
  setExam: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  teacher: string;
  setTeacher: (value: string) => void;
  customTeacher: string;
  setCustomTeacher: (value: string) => void;
  addingTeacher: boolean;
  onAddTeacher: () => void;
  teacherChoices: { id: string; name: string; subject: string }[];
  moduleKey: string;
  setModuleKey: (value: string) => void;
  toolKind: string;
  setToolKind: (value: string) => void;
  quizTier: string;
  setQuizTier: (value: string) => void;
}) {
  const fields = destination.fields;
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {fields.teacher ? (
        <label className="block text-sm text-muted sm:col-span-2">
          Teacher
          <select value={teacher} onChange={(e) => setTeacher(e.target.value)} required className={fieldClass}>
            {teacherChoices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.subject}
              </option>
            ))}
            <option value="__custom">Add new teacher…</option>
          </select>
          {teacher === "__custom" ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                required
                value={customTeacher}
                onChange={(e) => setCustomTeacher(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddTeacher();
                  }
                }}
                placeholder="Teacher name"
                className={`${fieldClass} mt-0 placeholder:text-zinc-500`}
              />
              <button
                type="button"
                disabled={addingTeacher || customTeacher.trim().length < 2}
                onClick={onAddTeacher}
                className="h-11 shrink-0 rounded-xl border border-line px-4 text-sm text-ink disabled:opacity-50"
              >
                {addingTeacher ? "Adding…" : "Add to list"}
              </button>
            </div>
          ) : null}
        </label>
      ) : null}
      {fields.subject ? (
        <label className="block text-sm text-muted">
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldClass}>
            {SUBJECT_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.classLevel ? (
        <label className="block text-sm text-muted">
          Class
          <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className={fieldClass}>
            {CLASS_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.chapter ? (
        <label className="block text-sm text-muted sm:col-span-2">
          Chapter
          <select value={chapter} onChange={(e) => setChapter(e.target.value)} className={fieldClass}>
            {chapterChoices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="__custom">Other chapter…</option>
          </select>
          {chapter === "__custom" ? (
            <input
              required
              value={customChapter}
              onChange={(e) => setCustomChapter(e.target.value)}
              placeholder="Chapter name"
              className={`${fieldClass} placeholder:text-zinc-500`}
            />
          ) : null}
        </label>
      ) : null}
      {fields.tier ? (
        <label className="block text-sm text-muted sm:col-span-2">
          Practice tier
          <select value={tier} onChange={(e) => setTier(e.target.value)} className={fieldClass}>
            {PRACTICE_TIER_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.detail}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.module ? (
        <label className="block text-sm text-muted sm:col-span-2">
          Teacher module
          <select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)} className={fieldClass}>
            {MODULE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} — {item.detail}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.toolKind ? (
        <label className="block text-sm text-muted sm:col-span-2">
          Tool kind
          <select value={toolKind} onChange={(e) => setToolKind(e.target.value)} className={fieldClass}>
            {TOOL_KIND_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.quizTier ? (
        <label className="block text-sm text-muted">
          Quiz tier
          <select value={quizTier} onChange={(e) => setQuizTier(e.target.value)} className={fieldClass}>
            {QUIZ_TIER_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.exam ? (
        <label className="block text-sm text-muted">
          Exam
          <select value={exam} onChange={(e) => setExam(e.target.value)} className={fieldClass}>
            {EXAM_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {fields.year ? (
        <label className="block text-sm text-muted">
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)} className={fieldClass}>
            {YEAR_OPTIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
