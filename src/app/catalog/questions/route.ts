import { NextResponse } from "next/server";
import { CHAPTERS, MOCK_QUESTIONS } from "@/data/mockCurriculum";
import { listDeskContents } from "@/lib/desk-contents";
import { collectExtractedQuestions } from "@/lib/extracted-questions";
import { chapterRecord, facultySlug } from "@/lib/faculty-catalog";
import { proxyLiveJson } from "@/lib/live-api";

function questionText(item: unknown) {
  if (!item || typeof item !== "object") return "";
  const row = item as Record<string, unknown>;
  return String(row.question || row.prompt || row.stem || row.title || "").trim();
}

function usableQuestions(list: unknown[]) {
  return list.filter((item) => questionText(item).length > 0);
}

function subjectOf(item: unknown) {
  if (!item || typeof item !== "object") return "";
  const row = item as Record<string, unknown>;
  return String(row.subject || row.subject_id || row.subject_slug || "").trim();
}

/** Normalize common subject aliases so math/chem/bio requests still hit mocks. */
function normalizeSubject(value: string | null | undefined) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (!raw) return "";
  if (raw === "math" || raw === "maths" || raw === "mathematics") return "mathematics";
  if (raw === "chem" || raw === "chemistry") return "chemistry";
  if (raw === "bio" || raw === "biology") return "biology";
  if (raw === "phy" || raw === "physics") return "physics";
  return facultySlug(raw);
}

function matchesSubject(itemSubject: string, wanted: string | null) {
  if (!wanted) return true;
  if (!itemSubject) return false;
  const a = normalizeSubject(itemSubject);
  const b = normalizeSubject(wanted);
  return Boolean(a && b && a === b);
}

function chapterAliases(chapter: string | null, subject: string | null) {
  if (!chapter) return new Set<string>();
  const wantedSubject = normalizeSubject(subject);
  const aliases = new Set([chapter, facultySlug(chapter), chapterRecord(chapter).id]);
  for (const row of CHAPTERS) {
    if (wantedSubject && normalizeSubject(row.subjectId) !== wantedSubject) {
      continue;
    }
    if (row.id === chapter || facultySlug(row.name) === facultySlug(chapter) || row.id === facultySlug(chapter)) {
      aliases.add(row.id);
      aliases.add(facultySlug(row.name));
    }
  }
  return aliases;
}

function filterLiveByRequest(list: unknown[], subject: string | null, chapter: string | null) {
  const aliases = chapterAliases(chapter, subject);
  return list.filter((item) => {
    if (!item || typeof item !== "object") return true;
    const row = item as Record<string, unknown>;
    const itemSubject = subjectOf(item);
    if (subject && itemSubject && !matchesSubject(itemSubject, subject)) return false;
    const itemChapter = String(row.chapter_id || row.chapter || row.chapter_slug || "").trim();
    if (aliases.size && itemChapter && !aliases.has(itemChapter) && !aliases.has(facultySlug(itemChapter))) {
      return false;
    }
    return true;
  });
}

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
    destination: "practice",
    subject,
    chapter,
    classLevel,
    tier,
    quizTier,
    exam,
    set,
  }).filter((item) => matchesSubject(item.subject || "", subject));

  // Empty-stem admin packs must not block subject mocks (Chem/Math/Physics were empty because of this).
  const questions = usableQuestions(
    extracted.map((item, index) => ({
      id: index + 1,
      subject: item.subject || subject,
      chapter: item.chapter || chapter,
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
    })),
  );

  if (questions.length) {
    return NextResponse.json({ questions, source: "admin" });
  }

  const live = await proxyLiveJson<{ questions?: unknown[] } | unknown[]>(req, `/api/questions${url.search}`);
  const liveList = filterLiveByRequest(
    usableQuestions(Array.isArray(live) ? live : live?.questions || []),
    subject,
    chapter,
  );
  if (liveList.length) {
    return NextResponse.json({ questions: liveList, source: "live" });
  }

  const aliases = chapterAliases(chapter, subject);
  const mock = MOCK_QUESTIONS.filter((item) => {
    if (subject && !matchesSubject(item.subject, subject)) return false;
    if (aliases.size && !aliases.has(item.chapter) && !aliases.has(facultySlug(item.chapter))) return false;
    if (tier && String(item.tier) !== String(tier)) return false;
    return true;
  });

  // Never fall back to another subject's mocks (that was serving Physics under Biology).
  if (!mock.length) {
    return NextResponse.json({ questions: [], source: "empty" });
  }

  const pack = mock.slice(0, 8).map((item) => ({
    id: item.id,
    subject: item.subject,
    chapter: item.chapter,
    question: item.question,
    prompt: item.question,
    options: item.options,
    correct_option: item.correctOption,
    correctOption: item.correctOption,
    explanation: item.explanation,
    solution: item.explanation,
    formula: item.formula,
  }));
  return NextResponse.json({ questions: pack, source: "mock" });
}
