import { NextResponse } from "next/server";
import { curriculumChapters } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ slug: string; classLevel: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { slug, classLevel } = await ctx.params;
  const live = await proxyLiveJson<{ chapters?: unknown[] }>(
    req,
    `/api/practice/subjects/${slug}/classes/${classLevel}/chapters`,
  );
  const seeded = curriculumChapters(slug, classLevel);
  const chapters = live?.chapters?.length ? live.chapters : seeded;
  return NextResponse.json({ chapters: chapters.length ? chapters : seeded });
}
