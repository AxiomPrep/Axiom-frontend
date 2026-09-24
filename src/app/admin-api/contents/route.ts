import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import type { AdminContent } from "@/lib/admin";
import {
  findDestination,
  findSlot,
  isHttpUrl,
  isWordFileName,
  isYoutubeUrl,
  kindFromFileName,
  liveTypeFor,
  sourcesForTeacherModule,
  type AdminSourceKind,
} from "@/lib/admin-destinations";
import { listStoredAdminContents, saveAdminContent, saveAdminFile } from "@/lib/admin-store";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

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

function asString(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;
  return NextResponse.json({ contents: await listStoredAdminContents() });
}

export async function POST(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (error || !admin) return error;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "validation_error", message: "Send the upload as form data." }, { status: 400 });
  }

  const title = asString(form.get("title"));
  const destinationId = asString(form.get("destination_id")) || "practice";
  const destination = findDestination(destinationId);
  const slot = findSlot(destination, asString(form.get("slot_id")));
  const moduleKey = asString(form.get("module"));
  const allowedSources =
    destination.id === "top-teachers" ? sourcesForTeacherModule(moduleKey || "lectures") : slot.sources;
  const youtubeUrl = asString(form.get("youtube_url"));
  const pdfUrl = asString(form.get("pdf_url"));
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (title.length < 2) {
    return NextResponse.json({ error: "validation_error", message: "Title is required." }, { status: 400 });
  }
  if (!youtubeUrl && !pdfUrl && !hasFile) {
    return NextResponse.json({ error: "validation_error", message: "Add the source this module needs." }, { status: 400 });
  }
  if (youtubeUrl && !allowedSources.includes("youtube")) {
    return NextResponse.json({ error: "validation_error", message: "This module does not take a YouTube link." }, { status: 400 });
  }
  if ((pdfUrl || (hasFile && file instanceof File && kindFromFileName(file.name) === "pdf")) && !allowedSources.includes("pdf") && !allowedSources.includes("pdf_link")) {
    return NextResponse.json({ error: "validation_error", message: "This module does not take a PDF." }, { status: 400 });
  }
  if (youtubeUrl && !isYoutubeUrl(youtubeUrl)) {
    return NextResponse.json({ error: "validation_error", message: "That YouTube link does not look valid." }, { status: 400 });
  }
  if (pdfUrl && !isHttpUrl(pdfUrl)) {
    return NextResponse.json({ error: "validation_error", message: "That PDF link does not look valid." }, { status: 400 });
  }
  if (pdfUrl && isYoutubeUrl(pdfUrl)) {
    return NextResponse.json({ error: "validation_error", message: "Put YouTube videos in the YouTube field, not the PDF link." }, { status: 400 });
  }
  if (hasFile && file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "validation_error", message: "File must be 15 MB or smaller." }, { status: 400 });
  }

  const id = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let storagePath: string | null = null;
  let fileName: string | null = null;
  let sourceKind: AdminSourceKind = youtubeUrl ? "youtube" : pdfUrl ? "pdf_link" : "document";

  if (hasFile && file instanceof File) {
    if (isWordFileName(file.name)) {
      return NextResponse.json(
        { error: "validation_error", message: "Word files are not accepted. Use PDF for books/notes or Excel for questions." },
        { status: 400 },
      );
    }
    sourceKind = kindFromFileName(file.name);
    if (!allowedSources.includes(sourceKind) && !allowedSources.includes("document")) {
      return NextResponse.json(
        { error: "validation_error", message: `This module wants ${allowedSources.join(", ")}, not ${sourceKind}.` },
        { status: 400 },
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveAdminFile(id, file.name, bytes);
    storagePath = saved.publicPath;
    fileName = file.name;
  }

  const content: AdminContent = {
    id,
    title,
    type: liveTypeFor(sourceKind),
    description: asString(form.get("description")) || null,
    external_url: youtubeUrl || pdfUrl || null,
    storage_path: storagePath,
    class_level: asString(form.get("class_level")) || null,
    subject: asString(form.get("subject")) || null,
    module: moduleKey || slot.id,
    is_published: asString(form.get("is_published")) !== "false",
    is_free_preview: asString(form.get("is_free_preview")) === "true",
    created_at: new Date().toISOString(),
    created_by: admin.email,
    live_id: null,
    live_error: null,
    destination_id: destination.id,
    destination_title: destination.title,
    destination_href: destination.href,
    slot_id: slot.id,
    slot_label: slot.label,
    source_kind: sourceKind,
    file_name: fileName,
    teacher: asString(form.get("teacher")) || null,
    chapter: asString(form.get("chapter")) || null,
    exam: asString(form.get("exam")) || null,
    year: asString(form.get("year")) || null,
    tier: asString(form.get("tier")) || null,
    tool_kind: asString(form.get("tool_kind")) || null,
    quiz_tier: asString(form.get("quiz_tier")) || null,
  };

  const liveExternal = youtubeUrl || pdfUrl || null;
  if (liveExternal) {
    const origin = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";
    try {
      const live = await fetch(`${origin}/api/admin/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": admin.email,
        },
        body: JSON.stringify({
          title: content.title,
          type: content.type,
          description: content.description,
          external_url: liveExternal,
          class_level: content.class_level,
          subject: content.subject,
          module: content.module,
          is_published: content.is_published,
          is_free_preview: content.is_free_preview,
        }),
      });
      const payload = (await live.json().catch(() => ({}))) as {
        content?: { id?: string };
        message?: string;
      };
      if (live.ok && payload.content?.id) {
        content.live_id = String(payload.content.id);
      } else {
        content.live_error =
          typeof payload.message === "string"
            ? payload.message
            : `Live API ${live.status}. Playing from this admin desk until /api/admin/contents is on the server.`;
      }
    } catch (err) {
      content.live_error = err instanceof Error ? err.message : "Could not reach the live API.";
    }
  }

  await saveAdminContent(content);
  return NextResponse.json({ content }, { status: 201 });
}
