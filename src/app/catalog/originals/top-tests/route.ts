import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ headline?: string; tests?: Array<Record<string, unknown>> }>(
    req,
    "/api/originals/top-tests",
  );
  const contents = await listDeskContents();
  const sets = filterDesk(contents, { destination: "originals-top-tests" }).filter(
    (item) => item.slot_id === "fst_set" || item.source_kind === "excel",
  );
  const videos = filterDesk(contents, { destination: "originals-top-tests" }).filter(
    (item) => item.slot_id === "fst_video" || item.source_kind === "youtube",
  );
  const tests = [
    ...sets.map((item) => ({
      id: item.id,
      title: item.title,
      exam_pattern: item.exam,
      total_marks: null,
      duration_sec: 3 * 60 * 60,
      question_count: 1,
      href: deskOpenHref(item),
    })),
    ...(live?.tests || []),
  ];
  return NextResponse.json({
    headline: live?.headline || "Full-fledged mock tests designed strictly on the latest NTA/JAB patterns.",
    tests,
    discussions: videos.map((item) => ({ id: item.id, title: item.title, href: deskOpenHref(item) })),
  });
}
