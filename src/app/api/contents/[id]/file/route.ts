import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { findDeskContent } from "@/lib/desk-contents";
import { adminFilesDir } from "@/lib/admin-store";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ id: string }> };

function contentTypeFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "xls") return "application/ms-excel";
  if (ext === "csv") return "text/csv";
  return "application/octet-stream";
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const live = await proxyLiveJson<{ play_url?: string | null }>(req, `/api/contents/${id}`);
  if (live?.play_url) {
    return NextResponse.redirect(live.play_url);
  }

  const stored = await findDeskContent(id);
  if (stored?.external_url) {
    return NextResponse.redirect(stored.external_url);
  }
  const filePath = stored?.storage_path || "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return NextResponse.redirect(filePath);
  }
  if (filePath.startsWith("/admin-api/files/")) {
    const name = path.basename(decodeURIComponent(filePath.replace("/admin-api/files/", "")));
    try {
      const bytes = await readFile(path.join(adminFilesDir(), name));
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": contentTypeFor(name),
          "Content-Disposition": `inline; filename="${name}"`,
        },
      });
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({ error: "not_found", message: "File not found." }, { status: 404 });
}
