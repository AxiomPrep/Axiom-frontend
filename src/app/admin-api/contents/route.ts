import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import type { AdminContent } from "@/lib/admin";
import { findDestination, findSlot, isYoutubeUrl } from "@/lib/admin-destinations";
import {
  findStoredAdminContent,
  isHiddenContent,
  listHiddenAdminIds,
  listHiddenAdminKeys,
  removeStoredAdminContent,
} from "@/lib/admin-store";

export const maxDuration = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_EXTS = new Set(["pdf", "xls", "xlsx", "csv"]);

function safeUploadName(name: string) {
  const cleaned = (name || "upload.pdf").replace(/[^\w.\- ]+/g, "_").trim() || "upload.pdf";
  const ext = cleaned.split(".").pop()?.toLowerCase() || "";
  if (FILE_EXTS.has(ext)) return cleaned;
  return `${cleaned.replace(/\.[^.]+$/, "") || "upload"}.pdf`;
}

const API_ORIGIN = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

function readAdminEmail(req: Request) {
  const header = req.headers.get("x-admin-email") || "";
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)axiom_admin_email=([^;]+)/)?.[1] || "";
  return decodeURIComponent(header || cookie);
}

function requireAdmin(req: Request) {
  const admin = findSeededAdmin(readAdminEmail(req));
  if (!admin) {
    return { admin: null, error: NextResponse.json({ error: "forbidden", message: "Admin seed access required." }, { status: 403 }) };
  }
  return { admin, error: null };
}

function liveHeaders(req: Request, adminEmail: string, json = true) {
  const headers = new Headers();
  headers.set("x-admin-email", adminEmail);
  if (json) headers.set("Content-Type", "application/json");
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  return headers;
}

function meta(description: string | null, key: string) {
  return description?.match(new RegExp(`${key}:([^\\n]+)`))?.[1]?.trim() || null;
}

function mapLiveRow(row: Record<string, unknown>, adminEmail: string): AdminContent {
  const description = typeof row.description === "string" ? row.description : null;
  const dest = meta(description, "destination");
  const subject = meta(description, "subject");
  const chapter = meta(description, "chapter") || (typeof row.chapter_id === "string" ? row.chapter_id : null);
  const destination = dest ? findDestination(dest) : findDestination("practice");
  const slot = findSlot(destination, typeof row.module === "string" ? row.module : "");
  const external = typeof row.external_url === "string" ? row.external_url : null;
  const hasFile = Boolean(row.storage_path);
  return {
    id: String(row.id),
    title: String(row.title || "Untitled"),
    type: row.type === "video" || row.type === "original" ? row.type : "note_pdf",
    description,
    external_url: external,
    storage_path: hasFile ? String(row.storage_path) : null,
    class_level: meta(description, "class_level") || (typeof row.class_level === "string" ? row.class_level : null),
    subject,
    module: typeof row.module === "string" ? row.module : slot.id,
    is_published: row.is_published !== false,
    is_free_preview: row.is_free_preview === true,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    created_by: adminEmail,
    live_id: String(row.id),
    live_error: null,
    destination_id: destination.id,
    destination_title: destination.title,
    destination_href: destination.href,
    slot_id: slot.id,
    slot_label: slot.label,
    source_kind: external && /youtube|youtu\.be/i.test(external) ? "youtube" : hasFile ? "pdf" : "pdf_link",
    file_name: null,
    teacher: meta(description, "teacher"),
    chapter,
    exam: null,
    year: null,
    tier: null,
    tool_kind: null,
    quiz_tier: null,
    extracted_kind: null,
    extracted_summary: null,
    extracted_questions: null,
  };
}

export async function GET(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;

  try {
    const live = await fetch(`${API_ORIGIN}/api/admin/contents`, {
      headers: liveHeaders(req, admin.email),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const payload = (await live.json().catch(() => ({}))) as { contents?: Record<string, unknown>[]; message?: string };
    if (!live.ok) {
      return NextResponse.json(
        { error: "live_unavailable", message: payload.message || "Render did not return the upload list." },
        { status: live.status || 502 },
      );
    }
    const hiddenIds = await listHiddenAdminIds().catch(() => []);
    const hiddenKeys = await listHiddenAdminKeys().catch(() => []);
    const contents = (payload.contents || [])
      .map((row) => mapLiveRow(row, admin.email))
      .filter((item) => {
        if (isHiddenContent(item, hiddenIds, hiddenKeys)) return false;
        if (item.title === "Lec 1: Introduction" || (item.description || "").includes("Sample lecture")) return false;
        return true;
      });
    return NextResponse.json({ contents });
  } catch {
    return NextResponse.json(
      { error: "live_unavailable", message: "Could not reach Render. Nothing was read from this computer." },
      { status: 502 },
    );
  }
}

function field(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function hasUploadFile(row: Record<string, unknown>) {
  const file = row.file;
  if (file instanceof File && file.size > 0) return true;
  return typeof row.file_base64 === "string" && row.file_base64.length > 20;
}

function mimeForName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "csv") return "text/csv";
  return "application/octet-stream";
}

async function fileFromRow(row: Record<string, unknown>) {
  if (row.file instanceof File && row.file.size > 0) return row.file;
  if (typeof row.file_base64 === "string" && row.file_base64.length > 20) {
    const bytes = Buffer.from(row.file_base64, "base64");
    const name = field(row, "file_name") || "upload.pdf";
    return new File([bytes], name, { type: mimeForName(name) });
  }
  return null;
}

function livePayloadFromAdminFields(row: Record<string, unknown>) {
  const title = field(row, "title");
  const youtubeUrl = field(row, "youtube_url");
  const pdfUrl = field(row, "pdf_url") || field(row, "external_url");
  const externalUrl = youtubeUrl || pdfUrl;
  const file = row.file instanceof File && row.file.size > 0 ? row.file : null;
  if (title.length < 2) {
    return { error: "Title is required." };
  }
  if (!externalUrl && !file && !hasUploadFile(row)) {
    return { error: "Add a YouTube or PDF link, or upload a PDF / Excel file." };
  }
  if (youtubeUrl && !isYoutubeUrl(youtubeUrl)) {
    return { error: "That YouTube link does not look valid." };
  }
  const description = [
    field(row, "description"),
    `destination:${field(row, "destination_id")}`,
    `subject:${field(row, "subject")}`,
    `chapter:${field(row, "chapter")}`,
    field(row, "teacher") ? `teacher:${field(row, "teacher")}` : "",
    field(row, "teacher_id") ? `teacher_id:${field(row, "teacher_id")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    body: {
      type: youtubeUrl ? "video" : "note_pdf",
      title,
      description,
      external_url: externalUrl || null,
      destination: field(row, "destination_id"),
      destination_id: field(row, "destination_id"),
      teacher: field(row, "teacher"),
      teacher_id: field(row, "teacher_id"),
      subject: field(row, "subject"),
      chapter: field(row, "chapter"),
      class_level: field(row, "class_level") || null,
      module: field(row, "module") || field(row, "slot_id") || null,
      slot_id: field(row, "slot_id"),
      is_published: field(row, "is_published") !== "false",
      is_free_preview: field(row, "is_free_preview") === "true" || hasUploadFile(row),
      file_name: field(row, "file_name") || (file instanceof File ? file.name : ""),
      file_base64: typeof row.file_base64 === "string" ? row.file_base64 : null,
    },
  };
}

async function readAdminBody(req: Request): Promise<Record<string, unknown> | null> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await req.json().catch(() => null)) as Record<string, unknown> | null;
  }
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  const row: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" || value instanceof File) row[key] = value;
  }
  return row;
}

export async function POST(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;

  const row = await readAdminBody(req);
  if (!row) {
    return NextResponse.json({ error: "validation_error", message: "Send the admin form or JSON." }, { status: 400 });
  }

  const mapped =
    field(row, "external_url") && field(row, "title") && (row.type === "video" || row.type === "note_pdf" || row.type === "original")
      ? { body: row }
      : livePayloadFromAdminFields(row);
  if ("error" in mapped && mapped.error) {
    return NextResponse.json({ error: "validation_error", message: mapped.error }, { status: 400 });
  }

  const file = await fileFromRow(row);
  const fields = { ...(mapped.body as Record<string, unknown>) };
  const fileName = safeUploadName(field(row, "file_name") || file?.name || "upload.pdf");

  const headers = liveHeaders(req, admin.email, !file);
  let body: BodyInit;
  if (file) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value == null || key === "file_base64" || key === "file") continue;
      form.set(key, typeof value === "string" ? value : String(value));
    }
    form.set("file", file, fileName);
    form.set("file_name", fileName);
    body = form;
  } else {
    body = JSON.stringify(fields);
  }

  try {
    const live = await fetch(`${API_ORIGIN}/api/admin/contents`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });
    const payload = (await live.json().catch(() => ({}))) as {
      content?: Record<string, unknown>;
      file_url?: string | null;
      message?: string;
      error?: string;
    };
    if (live.ok && payload.content?.id) {
      const content = mapLiveRow(payload.content, admin.email);
      const dest = findDestination(field(row, "destination_id") || field(row, "destination") || content.destination_id || "practice");
      content.destination_id = dest.id;
      content.destination_title = dest.title;
      content.destination_href = dest.href;
      if (payload.file_url) content.storage_path = payload.file_url;
      return NextResponse.json({ content }, { status: 201 });
    }
    return NextResponse.json(
      {
        error: payload.error || "live_rejected",
        message:
          payload.message ||
          `Render rejected that upload (${live.status}). Nothing was saved on this computer.`,
      },
      { status: live.status || 502 },
    );
  } catch (err) {
    const message = err instanceof Error && err.name === "TimeoutError"
      ? "Render timed out. The file was not saved."
      : "Could not reach Render. The file was not saved.";
    return NextResponse.json({ error: "live_unavailable", message }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;
  const adminEmail = admin.email;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "id_required", message: "Missing upload id." }, { status: 400 });
  }

  const stored = await findStoredAdminContent(id).catch(() => null);
  const liveId = stored?.live_id || (UUID.test(id) ? id : null);
  const match = {
    title: new URL(req.url).searchParams.get("title") || stored?.title || "",
    destination_id: new URL(req.url).searchParams.get("destination") || stored?.destination_id || "",
    file_name: new URL(req.url).searchParams.get("file") || stored?.file_name || "",
  };
  await removeStoredAdminContent(id, match).catch(() => {});
  if (liveId) await removeStoredAdminContent(liveId, match).catch(() => {});

  const deletedIds = new Set<string>();
  async function deleteLive(targetId: string) {
    if (!UUID.test(targetId) || deletedIds.has(targetId)) return false;
    const res = await fetch(`${API_ORIGIN}/api/admin/contents?id=${encodeURIComponent(targetId)}`, {
      method: "DELETE",
      headers: liveHeaders(req, adminEmail),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok || res.status === 404) {
      deletedIds.add(targetId);
      return true;
    }
    return false;
  }

  if (liveId) await deleteLive(liveId).catch(() => false);

  if (match.title) {
    try {
      const listed = await fetch(`${API_ORIGIN}/api/admin/contents`, {
        headers: liveHeaders(req, adminEmail),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const payload = (await listed.json().catch(() => ({}))) as { contents?: Array<Record<string, unknown>> };
      const needle = match.title.trim().toLowerCase();
      for (const row of payload.contents || []) {
        const title = String(row.title || "").trim().toLowerCase();
        if (title !== needle || !UUID.test(String(row.id || ""))) continue;
        await deleteLive(String(row.id)).catch(() => false);
      }
    } catch {
      /* local hide still removes it from this site */
    }
  }

  return NextResponse.json({ ok: true, deleted: [...deletedIds] });
}
