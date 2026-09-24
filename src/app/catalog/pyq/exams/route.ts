import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { deskFileUrl, deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ exams?: unknown[] } | unknown[]>(req, `/api/pyq/exams${url.search}`);
  const exams = Array.isArray(live) ? live : live?.exams || [];
  const desk = filterDesk(await listStoredAdminContents().catch(() => []), {
    destination: "pyq-bank",
    subject: url.searchParams.get("subject"),
    classLevel: url.searchParams.get("class"),
    chapter: url.searchParams.get("chapter_id") || url.searchParams.get("chapter"),
    exam: url.searchParams.get("exam"),
  });
  const extra = desk.map((item) => ({
    id: item.id,
    exam_name: item.title,
    name: item.title,
    title: item.title,
    year: item.year,
    shift: item.slot_label || item.source_kind,
    duration_minutes: 180,
    question_count: item.source_kind === "excel" ? 1 : 0,
    difficulty: "Uploaded",
    subject: item.subject,
    class_level: item.class_level,
    chapter: item.chapter,
    chapter_id: item.chapter,
    href: deskOpenHref(item),
    read_url: deskFileUrl(item),
  }));
  return NextResponse.json({ exams: [...extra, ...exams], desk });
}
