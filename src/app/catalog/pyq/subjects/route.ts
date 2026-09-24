import { NextResponse } from "next/server";
import { curriculumSubjects } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ subjects?: unknown[] }>(req, "/api/pyq/subjects");
  const subjects = live?.subjects?.length ? live.subjects : curriculumSubjects();
  return NextResponse.json({ subjects });
}
