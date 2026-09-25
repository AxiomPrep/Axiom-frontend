import { NextResponse } from "next/server";
import { inferToolKind, isHiddenFromOriginalsTools, TOOL_KIND_LABELS } from "@/lib/catalog";
import { listDeskContents } from "@/lib/desk-contents";
import { deskFileUrl, isToolsItem } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

function originalsToolKind(item: { tool_kind?: string | null; title?: string | null; description?: string | null; storage_path?: string | null; file_name?: string | null; destination_id?: string | null }) {
  return inferToolKind(item) || (item.destination_id === "originals-tools" ? "short_notes" : "");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const live = await proxyLiveJson<{ tools?: Array<Record<string, unknown>>; kinds?: string[] }>(
    req,
    `/api/originals/tools${url.search}`,
  );
  const contents = await listDeskContents();
  const desk = contents.filter((item) => {
    if (!item.is_published) return false;
    if (isHiddenFromOriginalsTools(item.title)) return false;
    if (item.destination_id && item.destination_id !== "originals-tools") return false;
    if (!isToolsItem(item) && item.destination_id !== "originals-tools") return false;
    const inferred = originalsToolKind(item);
    if (!inferred) return false;
    if (kind && inferred !== kind && item.tool_kind !== kind) return false;
    return true;
  });
  const seen = new Set<string>();
  const tools = [
    ...desk.map((item) => ({
      id: item.id,
      kind: originalsToolKind(item),
      title: item.title,
      external_url: item.external_url,
      storage_path: item.storage_path,
      class_level: item.class_level,
      read_url: deskFileUrl(item),
    })),
    ...(live?.tools || []).filter((row) => !isHiddenFromOriginalsTools(String(row.title || ""))),
  ].filter((row) => {
    const id = String(row.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return NextResponse.json({
    tools,
    kinds: live?.kinds?.length ? live.kinds : Object.keys(TOOL_KIND_LABELS),
  });
}
