import { NextResponse } from "next/server";
import { chapterRecord } from "@/lib/faculty-catalog";
import { listDeskContents } from "@/lib/desk-contents";
import { deskOpenHref, filterDesk } from "@/lib/desk-catalog";
import { mockPrerequisiteSequence } from "@/data/mock-originals";
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
    ...mockPrerequisiteSequence(chapter.id),
    desk: desk.map((item) => ({ ...item, href: deskOpenHref(item) })),
  });
}
