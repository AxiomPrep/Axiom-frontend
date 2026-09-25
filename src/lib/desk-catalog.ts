import { CHAPTERS, PRACTICE_TIERS, PYQ_EXAM_SETS, SUBJECTS } from "@/data/mockCurriculum";
import type { AdminContent } from "@/lib/admin";
import { inferToolKind, TOOL_KIND_LABELS } from "@/lib/catalog";
import { facultySlug, chapterFamily, chapterRecord } from "@/lib/faculty-catalog";
import { readerHref } from "@/lib/reader";

export type DeskFilters = {
  destination?: string | null;
  subject?: string | null;
  classLevel?: string | null;
  chapter?: string | null;
  exam?: string | null;
  year?: string | null;
  tier?: string | null;
  toolKind?: string | null;
  quizTier?: string | null;
};

function norm(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

export function sameSubject(itemSubject: string | null | undefined, filter?: string | null) {
  if (!filter) return true;
  const a = norm(itemSubject);
  const b = norm(filter);
  if (!a) return true;
  return a === b || a.includes(b) || b.includes(a);
}

export function sameChapter(itemChapter: string | null | undefined, filter?: string | null) {
  if (!filter) return true;
  if (!itemChapter) return false;
  const wanted = chapterFamily(filter);
  const got = chapterFamily(itemChapter);
  for (const key of got) if (wanted.has(key)) return true;
  return chapterRecord(itemChapter).id === chapterRecord(filter).id;
}

export function sameClass(itemClass: string | null | undefined, filter?: string | null) {
  if (!filter) return true;
  if (!itemClass) return true;
  if (itemClass === "dropper") return true;
  if (filter === "12" && itemClass === "dropper") return true;
  return itemClass === filter;
}

export function isToolsItem(item: AdminContent) {
  if (item.destination_id === "originals-tools") return true;
  const stored = (item.tool_kind || "").trim().replace(/-/g, "_");
  if (stored === "mind_map" || stored === "mindmaps") return true;
  if (stored && TOOL_KIND_LABELS[stored]) return true;
  const kind = inferToolKind(item);
  return kind === "mindmap" || kind === "full_notes" || kind === "formula_sheet";
}

export function deskMatches(item: AdminContent, filters: DeskFilters) {
  if (!item.is_published) return false;
  if (filters.destination && item.destination_id && item.destination_id !== filters.destination) {
    if (!(filters.destination === "originals-tools" && isToolsItem(item)) && !(filters.destination === "practice" && isToolsItem(item))) {
      return false;
    }
  }
  if (!sameSubject(item.subject, filters.subject)) return false;
  if (!sameClass(item.class_level, filters.classLevel)) return false;
  if (!sameChapter(item.chapter, filters.chapter)) return false;
  if (filters.exam && item.exam && norm(item.exam) !== norm(filters.exam)) return false;
  if (filters.year && item.year && item.year !== filters.year) return false;
  if (filters.tier && item.tier && String(item.tier) !== String(filters.tier)) return false;
  if (filters.toolKind && item.tool_kind && item.tool_kind !== filters.toolKind) return false;
  if (filters.quizTier && item.quiz_tier && item.quiz_tier !== filters.quizTier) return false;
  return true;
}

export function filterDesk(contents: AdminContent[], filters: DeskFilters) {
  return contents.filter((item) => deskMatches(item, filters));
}

export function deskFileUrl(item: AdminContent) {
  if (item.external_url) return item.external_url;
  if (item.storage_path) return `/catalog/contents/${item.id}/file`;
  return null;
}

export function deskOpenHref(item: AdminContent) {
  if (item.source_kind === "youtube" || item.type === "video") return `/watch/${item.id}`;
  if (item.extracted_kind === "questions" && item.extracted_questions?.length) {
    const query = new URLSearchParams();
    if (item.subject) query.set("subject", item.subject);
    if (item.chapter) query.set("chapter", item.chapter);
    query.set("class", item.class_level === "12" || item.class_level === "dropper" ? "12" : "11");
    if (item.tier) query.set("tier", String(item.tier));
    if (item.quiz_tier) query.set("quizTier", item.quiz_tier);
    if (item.exam) query.set("exam", item.exam);
    query.set("set", item.id);
    query.set("subjectName", item.subject || "Questions");
    query.set("chapterName", item.chapter || item.title);
    query.set("tierName", item.title);
    return `/practice/player?${query}`;
  }
  return readerHref({
    source: "content",
    id: item.id,
    title: item.title,
    url: deskFileUrl(item),
  });
}

export function deskKindLabel(item: AdminContent) {
  if (item.slot_label) return item.slot_label;
  if (item.source_kind === "youtube") return "YouTube";
  if (item.extracted_kind === "questions") return "Question set";
  if (item.extracted_kind === "notes") return "Book / notes";
  if (item.source_kind === "excel") return "Excel set";
  if (item.source_kind === "pdf" || item.source_kind === "pdf_link") return "PDF";
  return "Upload";
}

export function curriculumSubjects() {
  return SUBJECTS.map((subject) => ({
    id: subject.id,
    slug: subject.id,
    name: subject.name,
    formula: subject.formula,
    tagline: subject.tagline,
    description: subject.tagline,
    total_questions: subject.totalQuestions,
    question_count: subject.totalQuestions,
    class_11_count: subject.class11Count,
    class_12_count: subject.class12Count,
    class11_count: subject.class11Count,
    class12_count: subject.class12Count,
  }));
}

export function curriculumChapters(subjectId: string, classLevel: string) {
  const klass = classLevel === "12" ? "12" : "11";
  const subject = facultySlug(subjectId);
  return CHAPTERS.filter((chapter) => chapter.subjectId === subject && chapter.classNum === klass).map((chapter) => ({
    id: chapter.id,
    title: chapter.name,
    name: chapter.name,
    high_yield: Boolean(chapter.highYield),
    highYield: Boolean(chapter.highYield),
    completed_count: chapter.completedCount,
    total_count: chapter.totalCount,
    question_count: chapter.totalCount,
    jee_count: chapter.jeeCount,
    neet_count: chapter.neetCount,
    adv_count: chapter.advCount,
  }));
}

export function curriculumExams(filters: {
  subject?: string | null;
  classLevel?: string | null;
  chapter?: string | null;
}) {
  const subject = (filters.subject || "").toLowerCase();
  const klass = filters.classLevel === "12" ? "12" : filters.classLevel === "11" ? "11" : "";
  const chapter = (filters.chapter || "").toLowerCase();
  return PYQ_EXAM_SETS.filter((exam) => {
    if (subject && exam.subject !== subject) return false;
    if (klass && exam.classNum !== klass) return false;
    if (chapter && exam.chapter !== chapter) return false;
    return true;
  }).map((exam) => ({
    id: exam.id,
    exam_name: exam.examName,
    name: exam.examName,
    title: exam.examName,
    year: String(exam.year),
    shift: exam.shift || "",
    duration_minutes: exam.durationMinutes,
    question_count: exam.questionCount,
    difficulty: exam.difficulty,
    subject: exam.subject,
    class_level: exam.classNum,
    chapter: exam.chapter,
    chapter_id: exam.chapter,
    href: `/practice/player?subject=${exam.subject}&class=${exam.classNum}&chapter=${exam.chapter}&pyq=${exam.id}&tierName=${encodeURIComponent(exam.examName)}`,
    read_url: null,
  }));
}

function asRow(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function catalogCount(row: unknown) {
  const item = asRow(row);
  if (!item) return 0;
  return [
    "total_count",
    "question_count",
    "total_questions",
    "questions",
    "pyq_count",
    "jee_count",
    "neet_count",
    "adv_count",
    "class_11_count",
    "class_12_count",
  ].reduce((sum, key) => {
    const value = Number(item[key]);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
}

export function catalogKey(row: unknown) {
  const item = asRow(row);
  if (!item) return "";
  const id = String(item.slug || item.id || "");
  if (CHAPTERS.some((chapter) => chapter.id === id)) return id;
  const name = String(item.name || item.title || "");
  const named = CHAPTERS.find(
    (chapter) => facultySlug(chapter.name) === facultySlug(name) || chapter.id === facultySlug(name),
  );
  if (named) return named.id;
  return facultySlug(name || id);
}

export function mergeCatalogRows<T extends Record<string, unknown>>(live: T[], seed: T[]): T[] {
  if (!live.length) return seed;
  const seedBy = new Map(seed.map((row) => [catalogKey(row), row]));
  const used = new Set<string>();
  const merged = live.map((row) => {
    const key = catalogKey(row);
    if (key) used.add(key);
    const extra = seedBy.get(key);
    if (!extra) return row;
    if (catalogCount(row) > 0) return { ...extra, ...row };
    return { ...row, ...extra, id: row.id || extra.id };
  });
  for (const row of seed) {
    const key = catalogKey(row);
    if (key && !used.has(key)) merged.push(row);
  }
  return merged.length ? merged : seed;
}

export function mergeSubjects(live: Array<Record<string, unknown>>, seed: Array<Record<string, unknown>>) {
  if (!live.some((row) => catalogCount(row) > 0)) return seed;
  return mergeCatalogRows(live, seed);
}

export function mergeTiers(live: Array<Record<string, unknown>>, seed: Array<Record<string, unknown>>) {
  if (!live.length || !live.some((row) => catalogCount(row) > 0)) return seed;
  return live.map((row, index) => {
    const extra = seed.find((item) => Number(item.tier) === Number(row.tier || index + 1)) || seed[index];
    if (!extra) return row;
    if (catalogCount(row) > 0) return { ...extra, ...row };
    return { ...row, ...extra, tier: row.tier || extra.tier };
  });
}

export function curriculumTiers() {
  return PRACTICE_TIERS.map((tier) => ({
    tier: tier.tier,
    badge: tier.badge,
    name: tier.name,
    title: tier.name,
    subtitle: tier.subtitle,
    question_count: tier.questionCount,
    questions: tier.questionCount,
    difficulty: tier.difficulty,
    description: tier.description,
    time_per_question: tier.timePerQuestion,
    time: tier.timePerQuestion,
  }));
}

export function moduleKeyForDesk(item: AdminContent) {
  if (item.module === "module_video") return "lectures";
  if (item.module === "module_pdf") return "notes_pdf";
  return item.module || "lectures";
}
