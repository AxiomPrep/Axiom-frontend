import { NextResponse } from "next/server";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ acceptances?: unknown[]; count?: number }>(
    req,
    "/api/policy-acceptances",
  );
  return NextResponse.json({
    acceptances: live?.acceptances || [],
    count: live?.count || 0,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const live = await proxyLiveJson<{ acceptance?: unknown; ok?: boolean; message?: string; error?: string }>(
      req,
      "/api/policy-acceptances",
      { method: "POST", body },
    );
    if (!live?.acceptance) {
      return NextResponse.json(
        { error: live?.error || "unavailable", message: live?.message || "Could not save acceptance." },
        { status: 502 },
      );
    }
    return NextResponse.json(live);
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid",
        message: err instanceof Error ? err.message : "Could not save acceptance.",
      },
      { status: 400 },
    );
  }
}
