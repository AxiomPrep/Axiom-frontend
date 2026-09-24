import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { chapterPayload, findFacultyTeacher, teachersFromUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ id: string; chapterId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id, chapterId } = await ctx.params;
  const live = await proxyLiveJson<{ teacher_id?: string; items?: unknown[] }>(
    req,
    `/api/teachers/${id}/chapters/${chapterId}`,
  );
  if (live?.teacher_id) return NextResponse.json(live);

  const stored = await listStoredAdminContents().catch(() => []);
  const faculty = findFacultyTeacher(id, teachersFromUploads(stored));
  if (!faculty) {
    return NextResponse.json({ error: "not_found", message: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json(chapterPayload(faculty.id, chapterId, stored));
}
