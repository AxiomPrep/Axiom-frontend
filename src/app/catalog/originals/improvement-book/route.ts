import { NextResponse } from "next/server";
import { mockImprovementBook } from "@/data/mock-originals";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const live = await proxyLiveJson<{ mistakes?: unknown[]; total?: number }>(
    req,
    `/api/originals/improvement-book${url.search}`,
  );
  if (live?.mistakes?.length) {
    return NextResponse.json(live);
  }
  return NextResponse.json(mockImprovementBook(source));
}
