import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import { adminFilesDir } from "@/lib/admin-store";

function contentTypeFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "csv") return "text/csv";
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  return "application/octet-stream";
}

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)axiom_admin_email=([^;]+)/)?.[1] || "";
  const admin = findSeededAdmin(decodeURIComponent(cookie));
  if (!admin) {
    return NextResponse.json({ error: "forbidden", message: "Admin seed access required." }, { status: 403 });
  }

  const { name } = await ctx.params;
  const safe = path.basename(decodeURIComponent(name || ""));
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
