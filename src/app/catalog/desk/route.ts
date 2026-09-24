import { NextResponse } from "next/server";
import { listStoredAdminContents } from "@/lib/admin-store";
import { filterDesk } from "@/lib/desk-catalog";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const contents = await listStoredAdminContents().catch(() => []);
  const items = filterDesk(contents, {
    destination: url.searchParams.get("destination"),
    subject: url.searchParams.get("subject"),
    classLevel: url.searchParams.get("class"),
    chapter: url.searchParams.get("chapter"),
    exam: url.searchParams.get("exam"),
    year: url.searchParams.get("year"),
    tier: url.searchParams.get("tier"),
    toolKind: url.searchParams.get("kind"),
    quizTier: url.searchParams.get("quiz_tier"),
  });
  return NextResponse.json({ contents: items });
}
