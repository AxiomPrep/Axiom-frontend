import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import {
  listedFacultyTeachers,
  mergeTeacherLists,
  teacherFromFaculty,
  teacherMatchesSubject,
  teachersFromUploads,
} from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import type { Teacher } from "@/lib/api";

export async function GET(req: Request) {
  const subject = new URL(req.url).searchParams.get("subject");
  const live = await proxyLiveJson<{ teachers?: Teacher[] }>(req, `/api/teachers${new URL(req.url).search}`);
  const stored = await listStoredAdminContents().catch(() => []);
  const extra = [
    ...listedFacultyTeachers(),
    ...teachersFromUploads(stored).map(teacherFromFaculty),
  ];
  const teachers = mergeTeacherLists(live?.teachers || [], extra).filter((teacher) =>
    teacherMatchesSubject(teacher, subject),
  );
  return NextResponse.json({ teachers });
}
