import { NextResponse } from "next/server";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ plans?: Array<Record<string, unknown>> }>(req, "/api/plans");
  return NextResponse.json({ plans: live?.plans || [] });
}
