import { NextResponse } from "next/server";
import { chapterRecord } from "@/lib/faculty-catalog";
import { listDeskContents } from "@/lib/desk-contents";
import { deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ chapterId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { chapterId } = await ctx.params;
  const live = await proxyLiveJson<{
    target?: { id: string; title: string; class_level: string | null };
    message?: string;
    sequence?: unknown[];
  }>(req, `/api/originals/prerequisites/${chapterId}`);
  const chapter = chapterRecord(chapterId);
  const desk = filterDesk(await listDeskContents(), {
    destination: "prerequisites",
    chapter: chapterId,
  });
  if (live?.target) {
    return NextResponse.json({ ...live, desk });
  }
  return NextResponse.json({
    target: { id: chapter.id, title: chapter.title, class_level: null },
    message: desk.length
      ? "Uploaded prerequisite map for this chapter."
      : "No published prerequisite map for this chapter yet.",
    sequence: [{ sort_order: 0, chapter: { id: chapter.id, title: chapter.title, class_level: null } }],
    desk: desk.map((item) => ({ ...item, href: deskOpenHref(item) })),
  });
}
