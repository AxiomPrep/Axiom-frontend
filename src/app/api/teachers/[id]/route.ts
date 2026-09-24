import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { findFacultyTeacher, teacherFromFaculty, teachersFromUploads, teacherUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import type { Teacher } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const live = await proxyLiveJson<{ teacher?: Teacher; contents?: unknown[] }>(req, `/api/teachers/${id}`);
  if (live?.teacher) return NextResponse.json(live);

  const stored = await listStoredAdminContents().catch(() => []);
  const faculty = findFacultyTeacher(id, teachersFromUploads(stored));
  if (!faculty) {
    return NextResponse.json({ error: "not_found", message: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json({
    teacher: teacherFromFaculty(faculty),
    contents: teacherUploads(stored, faculty.id).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      is_free_preview: item.is_free_preview,
      is_published: item.is_published,
      sort_order: 0,
      batch_id: null,
    })),
  });
}
