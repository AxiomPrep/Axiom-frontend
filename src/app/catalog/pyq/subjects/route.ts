import { NextResponse } from "next/server";
import { curriculumSubjects, mergeSubjects } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ subjects?: Array<Record<string, unknown>> }>(req, "/api/pyq/subjects");
  const subjects = mergeSubjects(live?.subjects || [], curriculumSubjects());
  return NextResponse.json({ subjects });
}
