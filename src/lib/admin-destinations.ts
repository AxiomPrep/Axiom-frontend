import { CHAPTER_MODULES, TOOL_KIND_LABELS } from "@/lib/catalog";
import { CHAPTERS, PRACTICE_TIERS, SUBJECTS } from "@/data/mockCurriculum";

export const ADMIN_SOURCE_KINDS = ["youtube", "pdf", "pdf_link", "excel", "document", "image"] as const;
export type AdminSourceKind = (typeof ADMIN_SOURCE_KINDS)[number];

export type AdminSlot = {
  id: string;
  label: string;
  hint: string;
  sources: AdminSourceKind[];
};

export type AdminDestination = {
  id: string;
  group: string;
  title: string;
  href: string;
  what: string;
  where: string;
  slots: AdminSlot[];
  fields: {
    subject?: boolean;
    classLevel?: boolean;
    chapter?: boolean;
    tier?: boolean;
    exam?: boolean;
    year?: boolean;
    teacher?: boolean;
    module?: boolean;
    toolKind?: boolean;
    quizTier?: boolean;
  };
};

export const PRACTICE_TIER_OPTIONS = PRACTICE_TIERS.map((tier) => ({
  id: String(tier.tier),
  label: `${tier.badge} · ${tier.name}`,
  detail: tier.subtitle,
}));

export const SUBJECT_OPTIONS = SUBJECTS.map((subject) => ({
  id: subject.id,
  label: subject.name,
}));

export const CLASS_OPTIONS = [
  { id: "11", label: "Class 11" },
  { id: "12", label: "Class 12" },
  { id: "dropper", label: "Dropper" },
];

export const EXAM_OPTIONS = [
  { id: "jee_main", label: "JEE Main" },
  { id: "neet", label: "NEET UG" },
  { id: "jee_adv", label: "JEE Advanced" },
];

export const QUIZ_TIER_OPTIONS = [
  { id: "s1", label: "S1 — Easy" },
  { id: "s2", label: "S2 — Tough" },
  { id: "d1", label: "D1 — Advanced Easy" },
  { id: "d2", label: "D2 — Advanced Tough" },
  { id: "named", label: "Named quiz" },
];

export const MODULE_OPTIONS = CHAPTER_MODULES.map((mod) => ({
  id: mod.key,
  label: mod.title,
  detail: mod.subtitle,
}));

export const TOOL_KIND_OPTIONS = Object.entries(TOOL_KIND_LABELS).map(([id, label]) => ({ id, label }));

export const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];

export function chaptersFor(subjectId: string, classLevel: string) {
  const klass = classLevel === "12" ? "12" : "11";
  return CHAPTERS.filter((chapter) => chapter.subjectId === subjectId && chapter.classNum === klass).map((chapter) => ({
    id: chapter.id,
    label: chapter.name,
  }));
}

export const ADMIN_DESTINATIONS: AdminDestination[] = [
  {
    id: "practice",
    group: "Practice",
    title: "Practice",
    href: "/practice",
    what: "Question sets and solutions for the five practice tiers. Students open Practice, then subject → class → chapter → tier.",
    where: "Shows on /practice, then the player and reader for that chapter and tier.",
    fields: { subject: true, classLevel: true, chapter: true, tier: true },
    slots: [
      {
        id: "questions",
        label: "Question set",
        hint: "Excel (question, A–D, correct, explanation) or a question PDF. A notes PDF is saved as a book.",
        sources: ["excel", "pdf"],
      },
      {
        id: "solutions_doc",
        label: "Worked solutions",
        hint: "Upload a PDF or paste a PDF link for this exact tier.",
        sources: ["pdf", "pdf_link"],
      },
      {
        id: "solutions_video",
        label: "Solution lecture",
        hint: "YouTube walkthrough for this chapter and tier.",
        sources: ["youtube"],
      },
    ],
  },
  {
    id: "pyq-bank",
    group: "Practice",
    title: "PYQ Bank",
    href: "/pyq-bank",
    what: "Past papers and their discussion. Students filter subject → class → chapter → exam.",
    where: "Shows on /pyq-bank and opens in the reader or player.",
    fields: { subject: true, classLevel: true, chapter: true, exam: true, year: true },
    slots: [
      {
        id: "paper_excel",
        label: "Question sheet",
        hint: "Excel/CSV of the paper, or a question PDF. Notes PDFs stay as the paper book.",
        sources: ["excel", "pdf"],
      },
      {
        id: "paper_pdf",
        label: "Question paper",
        hint: "Upload the paper PDF or paste a PDF link. Question papers are extracted; notes stay as a book.",
        sources: ["pdf", "pdf_link"],
      },
      {
        id: "discussion",
        label: "Paper discussion",
        hint: "YouTube discussion of that paper.",
        sources: ["youtube"],
      },
    ],
  },
  {
    id: "top-teachers",
    group: "Teachers",
    title: "Top Teachers",
    href: "/top-teachers",
    what: "Pick a teacher and a module. Lectures, problem solving, PYQs solving, one shots, and revision take a YouTube link only. Notes PDF and Important PDFs take a PDF file or a PDF link.",
    where: "Shows on /top-teachers → teacher → class → chapter → module, then /watch or the reader. Related Q’s come from PYQ Bank for that chapter.",
    fields: { teacher: true, subject: true, classLevel: true, chapter: true, module: true },
    slots: [
      {
        id: "module_item",
        label: "Teacher module item",
        hint: "The fields below change with the module you pick.",
        sources: ["youtube"],
      },
    ],
  },
  {
    id: "originals-tools",
    group: "Originals",
    title: "Important Tools",
    href: "/originals/tools",
    what: "Mindmaps, formula sheets, short notes, laws, reactions, and diagrams.",
    where: "Shows on /originals/tools, filtered by tool kind, and opens in the reader.",
    fields: { subject: true, classLevel: true, chapter: true, toolKind: true },
    slots: [
      {
        id: "tool_file",
        label: "Tool document",
        hint: "Upload a PDF or paste a PDF link for that tool.",
        sources: ["pdf", "pdf_link"],
      },
    ],
  },
  {
    id: "originals-modules",
    group: "Originals",
    title: "Top Modules",
    href: "/originals/modules",
    what: "Flagship chapter learning modules.",
    where: "Shows on /originals/modules for the chosen subject and class.",
    fields: { subject: true, classLevel: true, chapter: true },
    slots: [
      {
        id: "module_video",
        label: "Module lecture",
        hint: "YouTube lecture for this module.",
        sources: ["youtube"],
      },
      {
        id: "module_pdf",
        label: "Module notes",
        hint: "Upload a PDF or paste a PDF link.",
        sources: ["pdf", "pdf_link"],
      },
    ],
  },
  {
    id: "originals-quizzes",
    group: "Originals",
    title: "Quiz Tests",
    href: "/originals/quizzes",
    what: "S1 / S2 / D1 / D2 chapter quizzes and named tests.",
    where: "Shows on /originals/quizzes after the student picks a chapter.",
    fields: { subject: true, classLevel: true, chapter: true, quizTier: true },
    slots: [
      {
        id: "quiz_set",
        label: "Quiz question set",
        hint: "Excel of questions, or a question PDF. Notes PDFs are saved as a book.",
        sources: ["excel", "pdf"],
      },
    ],
  },
  {
    id: "originals-custom-test",
    group: "Originals",
    title: "Guidance Test Builder",
    href: "/originals/custom-test",
    what: "Level-based question banks the custom test builder can pull from.",
    where: "Used when a student builds a test on /originals/custom-test.",
    fields: { subject: true, classLevel: true, chapter: true },
    slots: [
      {
        id: "bank",
        label: "Question bank",
        hint: "Excel bank, or a question PDF. Notes PDFs are saved as a book.",
        sources: ["excel", "pdf"],
      },
    ],
  },
  {
    id: "originals-top-tests",
    group: "Originals",
    title: "Top Tests / FST",
    href: "/originals/top-tests",
    what: "Full syllabus mocks on NTA / JAB patterns.",
    where: "Shows on /originals/top-tests.",
    fields: { exam: true, classLevel: true },
    slots: [
      {
        id: "fst_set",
        label: "Full syllabus test",
        hint: "Excel set, or a question PDF. Notes PDFs are saved as a book.",
        sources: ["excel", "pdf"],
      },
      {
        id: "fst_video",
        label: "Paper discussion",
        hint: "YouTube discussion of the mock.",
        sources: ["youtube"],
      },
    ],
  },
  {
    id: "study-hub-ncert",
    group: "Study Hub",
    title: "NCERT books",
    href: "/timer?tab=ncert",
    what: "Upload the actual NCERT PDF (or a PDF link) for that class and subject.",
    where: "Shows under Study Hub → NCERT Library and opens in the reader.",
    fields: { subject: true, classLevel: true },
    slots: [
      {
        id: "ncert_book",
        label: "NCERT book",
        hint: "Upload the NCERT PDF file here. A PDF link also works if you already have one hosted.",
        sources: ["pdf", "pdf_link"],
      },
    ],
  },
  {
    id: "study-sequences",
    group: "Originals",
    title: "Study Sequences",
    href: "/originals/study-sequences",
    what: "Goal-based path documents and intro videos.",
    where: "Shows on /originals/study-sequences.",
    fields: { subject: true, exam: true },
    slots: [
      {
        id: "sequence_doc",
        label: "Sequence plan",
        hint: "Upload a PDF or paste a PDF link.",
        sources: ["pdf", "pdf_link"],
      },
      {
        id: "sequence_video",
        label: "Sequence intro",
        hint: "YouTube intro for that path.",
        sources: ["youtube"],
      },
    ],
  },
  {
    id: "prerequisites",
    group: "Originals",
    title: "Prerequisite Mapping",
    href: "/originals/prerequisites",
    what: "What to finish before a chapter.",
    where: "Shows on /originals/prerequisites for the target chapter.",
    fields: { subject: true, classLevel: true, chapter: true },
    slots: [
      {
        id: "map_doc",
        label: "Prerequisite map",
        hint: "Excel of the chapter order.",
        sources: ["excel"],
      },
    ],
  },
];

export const VIDEO_MODULE_KEYS = ["lectures", "problem_solving", "pyqs_solving", "one_shots", "revision"] as const;
export const PDF_MODULE_KEYS = ["notes_pdf", "important_pdfs"] as const;

export function isVideoTeacherModule(moduleKey: string) {
  return (VIDEO_MODULE_KEYS as readonly string[]).includes(moduleKey);
}

export function sourcesForTeacherModule(moduleKey: string): AdminSourceKind[] {
  return isVideoTeacherModule(moduleKey) ? ["youtube"] : ["pdf", "pdf_link"];
}

export function findDestination(id: string) {
  return ADMIN_DESTINATIONS.find((item) => item.id === id) ?? ADMIN_DESTINATIONS[0];
}

export function findSlot(destination: AdminDestination, slotId: string) {
  return destination.slots.find((slot) => slot.id === slotId) ?? destination.slots[0];
}

export const SOURCE_ACCEPT: Record<AdminSourceKind, string> = {
  youtube: "",
  pdf: ".pdf,application/pdf",
  pdf_link: "",
  excel: ".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
  document: ".txt,.rtf,.ppt,.pptx,.odt,.ods",
  image: ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp",
};

export const SOURCE_LABELS: Record<AdminSourceKind, string> = {
  youtube: "YouTube link",
  pdf: "PDF file",
  pdf_link: "PDF link",
  excel: "Excel / CSV",
  document: "Other document",
  image: "Image",
};

export function isWordFileName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ext === "doc" || ext === "docx";
}

export function kindFromFileName(name: string): AdminSourceKind {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  return "document";
}

export function isYoutubeUrl(value: string) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com";
  } catch {
    return false;
  }
}

function youtubePlayerSrc(id: string) {
  const url = new URL(`https://www.youtube.com/embed/${id}`);
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("rel", "0");
  return url.toString();
}

export function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? youtubePlayerSrc(id) : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id ? youtubePlayerSrc(id) : value;
      }
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts?.[1]) return youtubePlayerSrc(shorts[1]);
      const id = url.searchParams.get("v");
      return id ? youtubePlayerSrc(id) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function liveTypeFor(source: AdminSourceKind): "video" | "note_pdf" | "original" {
  if (source === "youtube") return "video";
  if (source === "pdf" || source === "pdf_link") return "note_pdf";
  return "original";
}
