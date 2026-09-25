import { NextResponse } from "next/server";
import { mockPrepTracker } from "@/data/mock-originals";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ tracker?: unknown[] }>(req, `/api/originals/prep-tracker${url.search}`);
  const tracker = live?.tracker?.length
    ? live.tracker
    : mockPrepTracker({
        subject: url.searchParams.get("subject_id") || url.searchParams.get("subject"),
        classLevel: url.searchParams.get("class"),
      });
  return NextResponse.json({ tracker });
}
