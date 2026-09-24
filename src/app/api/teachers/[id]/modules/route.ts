import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { findFacultyTeacher, modulesPayload, teacherFromFaculty, teachersFromUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import type { Teacher } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const classLevel = new URL(req.url).searchParams.get("class");
  const live = await proxyLiveJson<{ teacher?: Teacher }>(
    req,
    `/api/teachers/${id}/modules${new URL(req.url).search}`,
  );
  if (live?.teacher) return NextResponse.json(live);

  const stored = await listStoredAdminContents().catch(() => []);
  const faculty = findFacultyTeacher(id, teachersFromUploads(stored));
  if (!faculty) {
    return NextResponse.json({ error: "teacher_not_found", message: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json(modulesPayload(teacherFromFaculty(faculty), stored, classLevel));
}
