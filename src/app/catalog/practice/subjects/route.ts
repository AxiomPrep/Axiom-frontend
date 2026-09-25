import { NextResponse } from "next/server";
import { curriculumSubjects } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ subjects?: Array<Record<string, unknown>> }>(req, "/api/practice/subjects");
  const liveSubjects = live?.subjects || [];
  const liveHasCounts = liveSubjects.some(
    (subject) => Number(subject.total_questions ?? subject.question_count ?? 0) > 0,
  );
  const subjects = liveHasCounts ? liveSubjects : curriculumSubjects();
  return NextResponse.json({ subjects });
}
