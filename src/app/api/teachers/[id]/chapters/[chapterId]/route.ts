import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { chapterPayload, resolveCatalogFaculty, teachersFromUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import { teacherName, type Teacher } from "@/lib/api";

type Ctx = { params: Promise<{ id: string; chapterId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id, chapterId } = await ctx.params;
  const live = await proxyLiveJson<{
    teacher_id?: string;
    items?: { id: string }[];
    modules?: Record<string, unknown[]>;
  }>(req, `/api/teachers/${id}/chapters/${chapterId}`);
  const liveTeacher = await proxyLiveJson<{ teacher?: Teacher }>(req, `/api/teachers/${id}`);

  const desk = await listDeskContents();
  const faculty = resolveCatalogFaculty(
    id,
    teachersFromUploads(desk),
    liveTeacher?.teacher ? teacherName(liveTeacher.teacher) : null,
  );
  const deskChapter = faculty ? chapterPayload(faculty.id, chapterId, desk) : null;

  if (live?.teacher_id && deskChapter) {
    const items = [...deskChapter.items, ...(live.items || [])].filter(
      (item, index, list) => list.findIndex((row) => row.id === item.id) === index,
    );
    const modules = { ...(live.modules || {}), ...deskChapter.modules };
    for (const [key, value] of Object.entries(deskChapter.modules)) {
      const current = Array.isArray(modules[key]) ? modules[key] : [];
      modules[key] = [...value, ...current].filter(
        (item, index, list) =>
          list.findIndex((row) => (row as { id?: string }).id === (item as { id?: string }).id) === index,
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
