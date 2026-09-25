import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { resolveCatalogFaculty, teacherFromFaculty, teachersFromUploads, teacherUploads } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";
import { teacherName, type Teacher } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const live = await proxyLiveJson<{ teacher?: Teacher; contents?: { id: string }[] }>(req, `/api/teachers/${id}`);
  const desk = await listDeskContents();
  const faculty = resolveCatalogFaculty(id, teachersFromUploads(desk), live?.teacher ? teacherName(live.teacher) : null);
  const deskContents = faculty
    ? teacherUploads(desk, faculty.id).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        is_free_preview: item.is_free_preview,
        is_published: item.is_published,
        sort_order: 0,
        batch_id: null,
      }))
    : [];

  if (live?.teacher) {
    const contents = [...deskContents, ...(live.contents || [])].filter(
      (item, index, list) => list.findIndex((row) => row.id === item.id) === index,
    );
    return NextResponse.json({ ...live, contents });
  }
  if (!faculty) {
    return NextResponse.json({ error: "not_found", message: "Teacher not found" }, { status: 404 });
  }
  return NextResponse.json({
    teacher: teacherFromFaculty(faculty),
    contents: deskContents,
  });
}
