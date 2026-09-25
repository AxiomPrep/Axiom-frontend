import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { curriculumTiers, filterDesk, mergeTiers } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ tiers?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
    req,
    `/api/practice/tiers${url.search}`,
  );
  const list = Array.isArray(live) ? live : live?.tiers || [];
  const tiers = mergeTiers(list, curriculumTiers());
  const stored = await listDeskContents();
  const subject = url.searchParams.get("subject");
  const classLevel = url.searchParams.get("class");
  const chapter = url.searchParams.get("chapter_id") || url.searchParams.get("chapter");
  const desk = [
    ...filterDesk(stored, { destination: "practice", subject, classLevel, chapter }),
    ...filterDesk(stored, { destination: "originals-tools", subject, classLevel, chapter }),
  ];
  return NextResponse.json({ tiers, desk });
}
