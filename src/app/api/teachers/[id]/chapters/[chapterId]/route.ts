import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { chapterPayload, findFacultyTeacher, teachersFromUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ id: string; chapterId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id, chapterId } = await ctx.params;
  const live = await proxyLiveJson<{
    teacher_id?: string;
    items?: { id: string }[];
    modules?: Record<string, unknown[]>;
  }>(req, `/api/teachers/${id}/chapters/${chapterId}`);

  const desk = await listDeskContents();
  const faculty = findFacultyTeacher(id, teachersFromUploads(desk));
  const deskChapter = faculty ? chapterPayload(faculty.id, chapterId, desk) : null;

  if (live?.teacher_id && deskChapter) {
    const items = [...deskChapter.items, ...(live.items || [])].filter(
      (item, index, list) => list.findIndex((row) => row.id === item.id) === index,
    );
    const modules = { ...(live.modules || {}), ...deskChapter.modules };
    for (const [key, value] of Object.entries(deskChapter.modules)) {
      const current = Array.isArray(modules[key]) ? modules[key] : [];
      modules[key] = [...value, ...current].filter(
        (item, index, list) => list.findIndex((row) => (row as { id?: string }).id === (item as { id?: string }).id) === index,
      );
    }
    return NextResponse.json({ ...live, items, modules });
  }
  if (deskChapter && (deskChapter.items.length || !live?.teacher_id)) {
    return NextResponse.json(deskChapter);
  }
  if (live?.teacher_id) return NextResponse.json(live);

  return NextResponse.json({ error: "not_found", message: "Teacher not found" }, { status: 404 });
}
