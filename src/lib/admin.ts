import type { AdminSourceKind } from "@/lib/admin-destinations";

export type AdminSession = {
  email: string;
  name: string;
};

export type ExtractedQuestion = {
  id: string;
  stem: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  page: number;
  source_pdf?: string | null;
};

export type AdminContent = {
  id: string;
  title: string;
  type: "video" | "note_pdf" | "original";
  description: string | null;
  external_url: string | null;
  storage_path: string | null;
  class_level: string | null;
  subject: string | null;
  module: string | null;
  is_published: boolean;
  is_free_preview: boolean;
  created_at: string;
  created_by: string;
  live_id?: string | null;
  live_error?: string | null;
  destination_id?: string | null;
  destination_title?: string | null;
  destination_href?: string | null;
  slot_id?: string | null;
  slot_label?: string | null;
  source_kind?: AdminSourceKind | null;
  file_name?: string | null;
  teacher?: string | null;
  chapter?: string | null;
  exam?: string | null;
  year?: string | null;
  tier?: string | null;
  tool_kind?: string | null;
  quiz_tier?: string | null;
  extracted_kind?: "questions" | "notes" | null;
  extracted_summary?: string | null;
  extracted_questions?: ExtractedQuestion[] | null;
};

const LIVE_API =
  process.env.NEXT_PUBLIC_API_ORIGIN || process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

export function mapLiveContent(row: Record<string, unknown>, adminEmail = "admin"): AdminContent {
  const description = typeof row.description === "string" ? row.description : null;
  const meta = (key: string) => description?.match(new RegExp(`${key}:([^\\n]+)`))?.[1]?.trim() || null;
  const dest = meta("destination");
  const subject = meta("subject") || (typeof row.subject === "string" ? row.subject : null);
  const chapter = meta("chapter") || (typeof row.chapter_id === "string" ? row.chapter_id : null);
  const teacher = meta("teacher") || meta("teacher_id") || (typeof row.teacher_id === "string" ? row.teacher_id : null);
  const external = typeof row.external_url === "string" ? row.external_url : null;
  const hasFile = Boolean(row.storage_path);
  return {
    id: String(row.id),
    title: String(row.title || "Untitled"),
    type: row.type === "video" || row.type === "original" ? row.type : "note_pdf",
    description,
    external_url: external,
    storage_path: hasFile ? String(row.storage_path) : null,
    class_level: meta("class_level") || (typeof row.class_level === "string" ? row.class_level : null),
    subject,
    module: typeof row.module === "string" ? row.module : meta("module"),
    is_published: row.is_published !== false,
    is_free_preview: row.is_free_preview === true,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    created_by: adminEmail,
    live_id: String(row.id),
    live_error: null,
    destination_id: dest,
    destination_title: dest,
    destination_href: dest ? `/${dest}` : null,
    slot_id: typeof row.module === "string" ? row.module : null,
    slot_label: typeof row.module === "string" ? row.module : null,
    source_kind: external && /youtube|youtu\.be/i.test(external) ? "youtube" : hasFile ? "pdf" : "pdf_link",
    file_name: null,
    teacher,
    chapter,
    exam: meta("exam"),
    year: meta("year"),
    tier: meta("tier"),
    tool_kind: meta("tool_kind"),
    quiz_tier: meta("quiz_tier"),
    extracted_kind: null,
    extracted_summary: null,
    extracted_questions: null,
  };
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, credentials: "include", headers });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : `Request failed (${res.status})`);
  }
  return data as T;
}

async function liveAdminFetch<T>(path: string, email: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("x-admin-email", email);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    const res = await fetch(`${LIVE_API}${path}`, { ...init, headers, cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(typeof data.message === "string" ? data.message : `Live API failed (${res.status})`);
    }
    return data as T;
  } catch (err) {
    if (path !== "/api/admin/contents") throw err;
    return adminFetch<T>("/admin-api/contents", {
      ...init,
      headers: { "x-admin-email": email, "Content-Type": "application/json" },
    });
  }
}

export function requestAdminAccess(email: string) {
  return adminFetch<AdminSession>("/admin-api/access", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function readAdminSession() {
  return adminFetch<AdminSession | { email: null }>("/admin-api/access");
}

export function clearAdminSession() {
  return adminFetch<{ ok: true }>("/admin-api/access", { method: "DELETE" });
}

export async function listAdminContents(email: string) {
  const payload = await liveAdminFetch<{ contents?: Record<string, unknown>[] }>("/api/admin/contents", email);
  return { contents: (payload.contents || []).map((row) => mapLiveContent(row, email)) };
}

export function listAdminTeachers() {
  return adminFetch<{ teachers: { id: string; name: string; subject: string }[] }>("/admin-api/teachers");
}

function asField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "string") return value.trim();
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return "";
}

export async function createAdminContent(body: FormData | Record<string, unknown>, email: string) {
  const row = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
  const youtubeUrl = asField(row, "youtube_url");
  const pdfUrl = asField(row, "pdf_url") || asField(row, "external_url");
  const externalUrl = youtubeUrl || pdfUrl;
  if (!externalUrl) {
    throw new Error("Save a YouTube or PDF link. Files cannot be stored on Netlify disk — they must go to the live API.");
  }
  const notes = asField(row, "description");
  const description = [
    notes,
    `destination:${asField(row, "destination_id")}`,
    `subject:${asField(row, "subject")}`,
    `chapter:${asField(row, "chapter")}`,
    asField(row, "class_level") ? `class_level:${asField(row, "class_level")}` : "",
    asField(row, "module") ? `module:${asField(row, "module")}` : "",
    asField(row, "teacher") ? `teacher:${asField(row, "teacher")}` : "",
    asField(row, "teacher_id") ? `teacher_id:${asField(row, "teacher_id")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const payload = await liveAdminFetch<{
    content?: Record<string, unknown>;
    file_url?: string | null;
    uploaded_by?: { email?: string };
  }>("/api/admin/contents", email, {
    method: "POST",
    body: JSON.stringify({
      type: youtubeUrl ? "video" : "note_pdf",
      title: asField(row, "title"),
      description,
      external_url: externalUrl,
      class_level: asField(row, "class_level") || null,
      subject: asField(row, "subject") || null,
      module: asField(row, "module") || asField(row, "slot_id") || null,
      is_published: asField(row, "is_published") !== "false",
      is_free_preview: asField(row, "is_free_preview") === "true",
    }),
  });
  if (!payload.content?.id) {
    throw new Error("Live API did not return a saved content row.");
  }
  const mapped = mapLiveContent(payload.content, payload.uploaded_by?.email || email);
  if (payload.file_url) mapped.storage_path = payload.file_url;
  return { content: mapped };
}
