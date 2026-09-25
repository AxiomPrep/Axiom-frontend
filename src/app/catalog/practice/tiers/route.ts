import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { curriculumTiers, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ tiers?: unknown[] } | unknown[]>(req, `/api/practice/tiers${url.search}`);
  const list = Array.isArray(live) ? live : live?.tiers || [];
  const tiers = list.length ? list : curriculumTiers();
  const desk = filterDesk(await listDeskContents(), {
    destination: "practice",
    subject: url.searchParams.get("subject"),
    classLevel: url.searchParams.get("class"),
    chapter: url.searchParams.get("chapter_id") || url.searchParams.get("chapter"),
  });
  return NextResponse.json({ tiers, desk });
}
