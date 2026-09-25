import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { mockStudySequences } from "@/data/mock-originals";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ sequences?: Array<Record<string, unknown>> }>(
    req,
    "/api/originals/study-sequences",
  );
  const desk = filterDesk(await listDeskContents(), { destination: "study-sequences" });
  const extras = desk.map((item) => ({
    id: item.id,
    slug: item.id,
    title: item.title,
    goal_key: item.exam || item.subject || "path",
    description: item.description || deskOpenHref(item),
    steps: [{ step: 1, action: item.source_kind === "youtube" ? "Watch the intro" : "Open the plan" }],
    href: deskOpenHref(item),
  }));
  const sequences = [...extras, ...(live?.sequences || [])];
  return NextResponse.json({ sequences: sequences.length ? sequences : mockStudySequences() });
}
