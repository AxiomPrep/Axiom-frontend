import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { deskFileUrl, filterDesk, moduleKeyForDesk } from "@/lib/desk-catalog";
import { toContentItem } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const live = await proxyLiveJson<{ modules?: Array<Record<string, unknown>> }>(
    req,
    `/api/originals/modules${url.search}`,
  );
  const desk = filterDesk(await listDeskContents(), {
    destination: "originals-modules",
    subject: url.searchParams.get("subject_id") || url.searchParams.get("subject"),
    classLevel: url.searchParams.get("class"),
    chapter: url.searchParams.get("chapter_id") || url.searchParams.get("chapter"),
  });
  const modules = [
    ...desk.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      class_level: item.class_level,
      content_id: item.source_kind === "youtube" || item.type === "video" ? item.id : null,
      test_id: null,
      module: moduleKeyForDesk(item),
      item: { ...toContentItem(item), external_url: deskFileUrl(item) },
      chapters: { title: item.chapter || undefined },
      subjects: { name: item.subject, slug: item.subject },
    })),
    ...(live?.modules || []),
  ];
  return NextResponse.json({ modules });
}
