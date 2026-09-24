import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ sequences?: Array<Record<string, unknown>> }>(
    req,
    "/api/originals/study-sequences",
  );
  const desk = filterDesk(await listStoredAdminContents().catch(() => []), { destination: "study-sequences" });
  const extras = desk.map((item) => ({
    id: item.id,
    slug: item.id,
    title: item.title,
    goal_key: item.exam || item.subject || "path",
    description: item.description || deskOpenHref(item),
    steps: [{ step: 1, action: item.source_kind === "youtube" ? "Watch the intro" : "Open the plan" }],
    href: deskOpenHref(item),
  }));
  return NextResponse.json({ sequences: [...extras, ...(live?.sequences || [])] });
}
