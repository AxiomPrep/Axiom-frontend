import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { adminFilesDir, findStoredAdminContent } from "@/lib/admin-store";

type Ctx = { params: Promise<{ id: string }> };

function contentTypeFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const stored = await findStoredAdminContent(id);
  if (!stored?.is_published || !stored.storage_path) {
    return NextResponse.json({ error: "not_found", message: "File not found." }, { status: 404 });
  }

  const storedName = decodeURIComponent(stored.storage_path.split("/").pop() || "");
  const safe = path.basename(storedName);
  if (!/^admin_[A-Za-z0-9._-]+$/.test(safe)) {
    return NextResponse.json({ error: "not_found", message: "File not found." }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(adminFilesDir(), safe));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentTypeFor(safe),
        "Content-Disposition": `inline; filename="${safe}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found", message: "File not found." }, { status: 404 });
  }
}
