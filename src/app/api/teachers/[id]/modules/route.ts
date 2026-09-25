import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import {
  labelTeacherChapters,
  modulesPayload,
  resolveCatalogFaculty,
  teacherFromFaculty,
  teacherUploads,
  teachersFromUploads,
} from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import { teacherName, type Teacher } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const classLevel = new URL(req.url).searchParams.get("class");
  const live = await proxyLiveJson<{
    teacher?: Teacher;
    popular_content?: unknown[];
    chapters?: { chapter_id: string; title: string; videos: number; pdfs: number }[];
    modules?: string[];
  }>(req, `/api/teachers/${id}/modules${new URL(req.url).search}`);

  const desk = await listDeskContents();
  const liveName = live?.teacher ? teacherName(live.teacher) : null;
  const faculty = resolveCatalogFaculty(id, teachersFromUploads(desk), liveName);
  let scopedClass = classLevel;
  let deskPayload = faculty ? modulesPayload(teacherFromFaculty(faculty), desk, scopedClass) : null;
  if (faculty && deskPayload && deskPayload.chapters.length === 0 && classLevel) {
    scopedClass = null;
    deskPayload = modulesPayload(teacherFromFaculty(faculty), desk, null);
  }
  const uploads = teacherUploads(desk, faculty?.id || id, scopedClass, liveName || faculty?.name);

  if (live?.teacher && deskPayload) {
    const popular = [...deskPayload.popular_content, ...(live.popular_content || [])].filter(
      (item, index, list) => list.findIndex((row) => row && typeof row === "object" && "id" in row && row.id === (item as { id: string }).id) === index,
    );
    return NextResponse.json({
      ...live,
      popular_content: popular,
      chapters: labelTeacherChapters([...deskPayload.chapters, ...(live.chapters || [])], uploads),
      modules: live.modules?.length ? live.modules : deskPayload.modules,
    });
  }
  if (deskPayload) {
    return NextResponse.json({
      ...deskPayload,
      chapters: labelTeacherChapters(deskPayload.chapters, uploads),
    });
  }
  if (live?.teacher) {
    return NextResponse.json({
      ...live,
      chapters: labelTeacherChapters(live.chapters || [], uploads),
    });
  }

  return NextResponse.json({ error: "teacher_not_found", message: "Teacher not found" }, { status: 404 });
}
