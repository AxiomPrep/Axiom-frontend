import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { modulesPayload, resolveCatalogFaculty, teacherFromFaculty, teachersFromUploads } from "@/lib/faculty-catalog";
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
  const faculty = resolveCatalogFaculty(id, teachersFromUploads(desk), live?.teacher ? teacherName(live.teacher) : null);
  let deskPayload = faculty ? modulesPayload(teacherFromFaculty(faculty), desk, classLevel) : null;
  if (faculty && deskPayload && deskPayload.chapters.length === 0 && classLevel) {
    deskPayload = modulesPayload(teacherFromFaculty(faculty), desk, null);
  }

  if (live?.teacher && deskPayload) {
    const chapters = new Map<string, { chapter_id: string; title: string; videos: number; pdfs: number }>();
    for (const chapter of [...(live.chapters || []), ...deskPayload.chapters]) {
      const current = chapters.get(chapter.chapter_id) || { ...chapter, videos: 0, pdfs: 0 };
      current.videos += chapter.videos || 0;
      current.pdfs += chapter.pdfs || 0;
      current.title = current.title || chapter.title;
      chapters.set(chapter.chapter_id, current);
    }
    const popular = [...deskPayload.popular_content, ...(live.popular_content || [])].filter(
      (item, index, list) => list.findIndex((row) => row && typeof row === "object" && "id" in row && row.id === (item as { id: string }).id) === index,
    );
    return NextResponse.json({
      ...live,
      popular_content: popular,
      chapters: [...chapters.values()],
      modules: live.modules?.length ? live.modules : deskPayload.modules,
    });
  }
  if (deskPayload) return NextResponse.json(deskPayload);
  if (live?.teacher) return NextResponse.json(live);

  return NextResponse.json({ error: "teacher_not_found", message: "Teacher not found" }, { status: 404 });
}
