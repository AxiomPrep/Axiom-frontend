import { NextResponse } from "next/server";
import { TOOL_KIND_LABELS } from "@/lib/catalog";
import { listDeskContents } from "@/lib/desk-contents";
import { deskFileUrl, filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const live = await proxyLiveJson<{ tools?: Array<Record<string, unknown>>; kinds?: string[] }>(
    req,
    `/api/originals/tools${url.search}`,
  );
  const desk = filterDesk(await listDeskContents(), {
    destination: "originals-tools",
    toolKind: kind,
  });
  const tools = [
    ...desk.map((item) => ({
      id: item.id,
      kind: item.tool_kind || "short_notes",
      title: item.title,
      external_url: item.external_url,
      storage_path: item.storage_path,
      class_level: item.class_level,
      read_url: deskFileUrl(item),
    })),
    ...(live?.tools || []),
  ];
  return NextResponse.json({
    tools,
    kinds: live?.kinds?.length ? live.kinds : Object.keys(TOOL_KIND_LABELS),
  });
}
