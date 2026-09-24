import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { deskFileUrl, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ books?: Array<Record<string, unknown>> }>(req, "/api/ncert");
  const desk = filterDesk(await listStoredAdminContents().catch(() => []), { destination: "study-hub-ncert" });
  const books = [
    ...desk.map((item) => ({
      id: item.id,
      title: item.title,
      class_level: item.class_level,
      cover_url: null,
      subjects: { name: item.subject, slug: item.subject },
      read_url: deskFileUrl(item),
    })),
    ...(live?.books || []),
  ];
  return NextResponse.json({ books });
}
