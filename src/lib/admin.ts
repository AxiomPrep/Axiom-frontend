import type { AdminSourceKind } from "@/lib/admin-destinations";
import { inferToolKind } from "@/lib/catalog";

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
  chapter_id?: string | null;
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
  const namedChapter = meta("chapter") || (typeof row.chapter === "string" ? row.chapter : null);
  const chapterId = typeof row.chapter_id === "string" ? row.chapter_id : null;
  const chapter =
    (namedChapter && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(namedChapter) && !/^[0-9a-f]{8}$/i.test(namedChapter)
      ? namedChapter
      : null) ||
    (chapterId && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(chapterId) ? chapterId : null) ||
    namedChapter ||
    chapterId;
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
    destination_id:
      dest ||
      (["lectures", "problem_solving", "pyqs_solving", "one_shots", "revision", "notes_pdf", "important_pdfs"].includes(
        String(row.module || ""),
      )
        ? "top-teachers"
        : null),
    destination_title: dest,
    destination_href: dest ? `/${dest}` : null,
    slot_id: typeof row.module === "string" ? row.module : null,
    slot_label: typeof row.module === "string" ? row.module : null,
    source_kind: external && /youtube|youtu\.be/i.test(external) ? "youtube" : hasFile ? "pdf" : "pdf_link",
    file_name: null,
    teacher,
    chapter,
    chapter_id: chapterId,
    exam: meta("exam"),
    year: meta("year"),
    tier: meta("tier"),
    tool_kind:
      dest === "originals-tools"
        ? inferToolKind({
            tool_kind: meta("tool_kind") || (typeof row.tool_kind === "string" ? row.tool_kind : null),
            title: String(row.title || ""),
            description,
          })
        : meta("tool_kind") || (typeof row.tool_kind === "string" ? row.tool_kind : null),
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
    const res = await fetch(`${LIVE_API}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: init?.signal || AbortSignal.timeout(init?.body instanceof FormData ? 120000 : 20000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      const err = new Error(
        typeof data.message === "string" ? data.message : `Live API failed (${res.status})`,
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return data as T;
  } catch (err) {
    if (init?.body instanceof FormData) throw err;
    const status = err && typeof err === "object" && "status" in err ? Number(err.status) : 0;
    if (path.split("?")[0] !== "/api/admin/contents" || (status >= 400 && status < 500)) throw err;
    const retryHeaders: Record<string, string> = { "x-admin-email": email };
    if (!(init?.body instanceof FormData)) retryHeaders["Content-Type"] = "application/json";
    return adminFetch<T>("/admin-api/contents", { ...init, headers: retryHeaders });
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

export async function listAdminContents(_email: string) {
  const payload = await adminFetch<{ contents?: AdminContent[] }>("/admin-api/contents");
  return { contents: payload.contents || [] };
}

export function listAdminTeachers() {
  return adminFetch<{ teachers: { id: string; name: string; subject: string; listed?: boolean }[] }>(
    "/admin-api/teachers",
  );
}

export function createAdminTeacher(name: string, subject: string) {
  return adminFetch<{ teacher: { id: string; name: string; subject: string; listed?: boolean } }>(
    "/admin-api/teachers",
    {
      method: "POST",
      body: JSON.stringify({ name, subject }),
    },
  );
}

export function deleteAdminContent(
  id: string,
  match?: { title?: string | null; destination_id?: string | null; file_name?: string | null },
) {
  const query = new URLSearchParams({ id });
  if (match?.title) query.set("title", match.title);
  if (match?.destination_id) query.set("destination", match.destination_id);
  if (match?.file_name) query.set("file", match.file_name);
  return adminFetch<{ ok: true }>(`/admin-api/contents?${query.toString()}`, { method: "DELETE" });
}

function asField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "string") return value.trim();
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return "";
}

function adminDescription(row: Record<string, unknown>) {
  const notes = asField(row, "description");
  return [
    notes,
    `destination:${asField(row, "destination_id")}`,
    `subject:${asField(row, "subject")}`,
    `chapter:${asField(row, "chapter")}`,
    asField(row, "class_level") ? `class_level:${asField(row, "class_level")}` : "",
    asField(row, "module") ? `module:${asField(row, "module")}` : "",
    asField(row, "teacher") ? `teacher:${asField(row, "teacher")}` : "",
    asField(row, "teacher_id") ? `teacher_id:${asField(row, "teacher_id")}` : "",
    asField(row, "tool_kind") ? `tool_kind:${asField(row, "tool_kind")}` : "",
    asField(row, "exam") ? `exam:${asField(row, "exam")}` : "",
    asField(row, "year") ? `year:${asField(row, "year")}` : "",
    asField(row, "tier") ? `tier:${asField(row, "tier")}` : "",
    asField(row, "quiz_tier") ? `quiz_tier:${asField(row, "quiz_tier")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fileFromRow(body: FormData | Record<string, unknown>, row: Record<string, unknown>) {
  const raw = body instanceof FormData ? body.get("file") : row.file;
  if (!raw || typeof raw === "string") return null;
  const file = raw as File;
  return typeof file.arrayBuffer === "function" && file.size > 0 ? file : null;
}

export async function createAdminContent(body: FormData | Record<string, unknown>, email: string) {
  const row = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
  const file = fileFromRow(body, row);
  const youtubeUrl = asField(row, "youtube_url");
  const pdfUrl = asField(row, "pdf_url") || asField(row, "external_url");
  const cleanLink = (value: string) =>
    /^https?:\/\//i.test(value) && !value.includes("...") ? value : "";
  const externalUrl = cleanLink(youtubeUrl) || cleanLink(pdfUrl);
  const title = asField(row, "title") || (file?.name || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (title.length < 2) {
    throw new Error("Title is required.");
  }
  if (!externalUrl && !file) {
    throw new Error("Add a YouTube or PDF link, or upload a PDF / Excel file.");
  }
  if (file && file.size > 15 * 1024 * 1024) {
    throw new Error("That file is over 15 MB. Compress it or use a PDF link.");
  }
  const description = adminDescription(row);
  let storagePath: string | null = null;
  if (file) {
    const signed = await liveAdminFetch<{
      upload_url: string;
      storage_path: string;
      token?: string;
    }>("/api/uploads/signed-url", email, {
      method: "POST",
      body: JSON.stringify({
        filename: file.name || "upload.pdf",
        kind: "content",
      }),
    });
    if (!signed.upload_url || !signed.storage_path) {
      throw new Error("Render did not issue an upload URL.");
    }
    const putHeaders: Record<string, string> = {
      "Content-Type": file.type || "application/pdf",
    };
    if (signed.token) putHeaders.Authorization = `Bearer ${signed.token}`;
    const put = await fetch(signed.upload_url, {
      method: "PUT",
      headers: putHeaders,
      body: file,
    });
    if (!put.ok) {
      throw new Error(`Storage rejected the PDF (${put.status}).`);
    }
    storagePath = signed.storage_path;
  }
  const payload = await liveAdminFetch<{
    content?: AdminContent;
    file_url?: string | null;
    uploaded_by?: { email?: string };
  }>("/api/admin/contents", email, {
    method: "POST",
    body: JSON.stringify({
      type: youtubeUrl ? "video" : "note_pdf",
      title,
      description,
      youtube_url: cleanLink(youtubeUrl) || null,
      pdf_url: cleanLink(pdfUrl) || null,
      external_url: externalUrl || null,
      destination: asField(row, "destination_id"),
      destination_id: asField(row, "destination_id"),
      teacher: asField(row, "teacher") || null,
      teacher_id: asField(row, "teacher_id") || null,
      subject: asField(row, "subject") || null,
      chapter: asField(row, "chapter") || null,
      class_level: asField(row, "class_level") || null,
      module: asField(row, "module") || asField(row, "slot_id") || null,
      slot_id: asField(row, "slot_id") || null,
      is_published: asField(row, "is_published") !== "false",
      is_free_preview: asField(row, "is_free_preview") === "true" || Boolean(file),
      file_name: file?.name || null,
      storage_path: storagePath,
    }),
  });
  if (!payload.content?.id) {
    throw new Error("Render did not save that upload. Nothing was kept on this computer.");
  }
  const content = mapLiveContent(payload.content, payload.uploaded_by?.email || email);
  content.live_id = String(payload.content.id);
  if (payload.file_url) content.storage_path = payload.file_url;
  if (file) content.file_name = file.name;
  return { content };
}
