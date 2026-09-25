import { NextResponse } from "next/server";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ contents?: unknown[] }>(req, `/api/contents${url.search}`);
  if (live) return NextResponse.json(live);
  return NextResponse.json({ contents: [] });
}
