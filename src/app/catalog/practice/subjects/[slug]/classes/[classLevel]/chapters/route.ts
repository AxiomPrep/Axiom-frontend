import { NextResponse } from "next/server";
import { CHAPTERS } from "@/data/mockCurriculum";
import { listDeskContents } from "@/lib/desk-contents";
import { chapterRecord, facultySlug } from "@/lib/faculty-catalog";
import { curriculumChapters, filterDesk, mergeCatalogRows } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

type Ctx = { params: Promise<{ slug: string; classLevel: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { slug, classLevel } = await ctx.params;
  const klass = classLevel === "12" ? "12" : "11";
  const live = await proxyLiveJson<{ chapters?: Array<Record<string, unknown>> }>(
    req,
    `/api/practice/subjects/${slug}/classes/${classLevel}/chapters`,
  );
  const seeded = curriculumChapters(slug, classLevel) as Array<Record<string, unknown>>;
  const stored = await listDeskContents();
  const desk = [
    ...filterDesk(stored, { destination: "practice", subject: slug, classLevel }),
    ...filterDesk(stored, { destination: "originals-tools", subject: slug, classLevel }),
  ];
  const uploadedMerged = new Map<string, Record<string, unknown>>();
  for (const item of desk) {
    if (!item.chapter && !item.title) continue;
    const chapter = chapterRecord(item.chapter || item.title);
    const seed = CHAPTERS.find((row) => row.id === chapter.id);
    if (!seed || seed.subjectId !== facultySlug(slug) || seed.classNum !== klass) continue;
    const count = item.extracted_questions?.length || 0;
    const current = uploadedMerged.get(seed.id);
    uploadedMerged.set(seed.id, {
      id: seed.id,
      title: seed.name,
      name: seed.name,
      high_yield: Boolean(seed.highYield),
      highYield: Boolean(seed.highYield),
      completed_count: seed.completedCount,
      total_count: Math.max(count, current ? Number(current.total_count || 0) : 0, seed.totalCount),
      question_count: Math.max(count, current ? Number(current.question_count || 0) : 0, seed.totalCount),
      jee_count: seed.jeeCount,
      neet_count: seed.neetCount,
      adv_count: seed.advCount,
    });
  }
  const chapters = mergeCatalogRows([...(live?.chapters || []), ...uploadedMerged.values()], seeded);
  return NextResponse.json({ chapters });
}