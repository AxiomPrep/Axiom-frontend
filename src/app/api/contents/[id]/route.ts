import { NextResponse } from "next/server";
import { youtubeEmbedUrl } from "@/lib/admin-destinations";
import { findStoredAdminContent } from "@/lib/admin-store";
import { chapterRecord } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ id: string }> };

function playUrlFor(externalUrl: string | null, storagePath: string | null, contentId: string) {
  if (externalUrl) return youtubeEmbedUrl(externalUrl) || externalUrl;
  if (storagePath) return storagePath.startsWith("/admin-api/files/") ? `/catalog/contents/${contentId}/file` : storagePath;
  return null;
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const live = await proxyLiveJson<{ content?: Record<string, unknown>; play_url?: string | null }>(
    req,
    `/api/contents/${id}`,
  );
  if (live?.content) return NextResponse.json(live);

  const stored = await findStoredAdminContent(id);
  if (!stored || !stored.is_published) {
    return NextResponse.json({ error: "not_found", message: "Content not found" }, { status: 404 });
  }

  const chapter = stored.chapter ? chapterRecord(stored.chapter) : null;
  return NextResponse.json({
    content: {
      id: stored.id,
      title: stored.title,
      description: stored.description,
      type: stored.type,
      module: stored.module,
      chapter_id: chapter?.id || stored.chapter,
      teacher_id: stored.teacher,
      duration_sec: null,
      is_free_preview: stored.is_free_preview,
      timeline: [],
    },
    play_url: playUrlFor(stored.external_url, stored.storage_path, stored.id),
    timeline: [],
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const live = await proxyLiveJson<Record<string, unknown>>(req, `/api/contents/${id}`, {
    method: "POST",
    body,
  });
  if (live) return NextResponse.json(live);

  if (body.action === "lecture_watch" || body.watched_sec) {
    return NextResponse.json({ ok: true, watched_sec: Number(body.watched_sec) || 0 });
  }

  return NextResponse.json({
    lecture_id: id,
    exam: body.exam || "jee_main",
    questions: [],
    prompt: "Test your understanding by solving Top PYQs related strictly to the topics covered in this lecture.",
  });
}
