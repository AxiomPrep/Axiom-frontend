import { NextResponse } from "next/server";
import { listDeskContents } from "@/lib/desk-contents";
import { collectExtractedQuestions } from "@/lib/extracted-questions";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const chapter = url.searchParams.get("chapter_id") || url.searchParams.get("chapter");
  const classLevel = url.searchParams.get("class") || url.searchParams.get("class_level");
  const tier = url.searchParams.get("tier");
  const quizTier = url.searchParams.get("quiz_tier") || url.searchParams.get("quizTier");
  const exam = url.searchParams.get("exam");
  const set = url.searchParams.get("set");

  const extracted = collectExtractedQuestions(await listDeskContents(), {
    subject,
    chapter,
    classLevel,
    tier,
    quizTier,
    exam,
    set,
  });

  const questions = extracted.map((item, index) => ({
    id: index + 1,
    question: item.stem,
    prompt: item.stem,
    options: item.options,
    correct_option: item.correctOption,
    correctOption: item.correctOption,
    explanation: item.explanation,
    solution: item.explanation,
    page: item.page,
    source_pdf: item.source_pdf,
    figure_page: item.page,
    set_id: item.set_id,
  }));

  if (questions.length) {
    return NextResponse.json({ questions, source: "admin" });
  }

  const live = await proxyLiveJson<{ questions?: unknown[] } | unknown[]>(req, `/api/questions${url.search}`);
  const liveList = Array.isArray(live) ? live : live?.questions || [];
  return NextResponse.json({ questions: liveList, source: liveList.length ? "live" : "empty" });
}
