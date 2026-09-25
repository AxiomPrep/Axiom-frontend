import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import type { AdminContent } from "@/lib/admin";
import { findDestination, findSlot } from "@/lib/admin-destinations";

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

function liveHeaders(req: Request, adminEmail: string) {
  const headers = new Headers();
  headers.set("x-admin-email", adminEmail);
  headers.set("Content-Type", "application/json");
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  return headers;
}

function mapLiveRow(row: Record<string, unknown>, adminEmail: string): AdminContent {
  const description = typeof row.description === "string" ? row.description : null;
  const dest = description?.match(/destination:([^\n]+)/)?.[1] || null;
  const subject = description?.match(/subject:([^\n]+)/)?.[1] || null;
  const chapter = description?.match(/chapter:([^\n]+)/)?.[1] || (typeof row.chapter_id === "string" ? row.chapter_id : null);
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
    class_level: typeof row.class_level === "string" ? row.class_level : null,
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
    teacher: description?.match(/teacher:([^\n]+)/)?.[1] || null,
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
        { error: "live_unavailable", message: payload.message || `Live API ${live.status}` },
        { status: live.status === 401 || live.status === 403 ? live.status : 502 },
      );
    }
    return NextResponse.json({ contents: (payload.contents || []).map((row) => mapLiveRow(row, admin.email)) });
  } catch (err) {
    return NextResponse.json(
      { error: "live_unavailable", message: err instanceof Error ? err.message : "Could not reach the live API." },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "validation_error", message: "Send JSON for the live catalog." }, { status: 400 });
  }

  try {
    const live = await fetch(`${API_ORIGIN}/api/admin/contents`, {
      method: "POST",
      headers: liveHeaders(req, admin.email),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    const payload = (await live.json().catch(() => ({}))) as {
      content?: Record<string, unknown>;
      message?: string;
    };
    if (!live.ok || !payload.content?.id) {
      return NextResponse.json(
        { error: "live_save_failed", message: payload.message || `Live API ${live.status}` },
        { status: live.status >= 400 && live.status < 500 ? live.status : 502 },
      );
    }
    return NextResponse.json({ content: mapLiveRow(payload.content, admin.email) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "live_unavailable", message: err instanceof Error ? err.message : "Could not reach the live API." },
      { status: 502 },
    );
  }
}
