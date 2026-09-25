import { CHAPTERS } from "@/data/mockCurriculum";
import { SEEDED_TEACHERS, USUAL_TEACHER_EXPERIENCE, USUAL_TEACHER_SELECTIONS, type AdminTeacher } from "@/data/admin-teachers";
import type { AdminContent } from "@/lib/admin";
import type { ChapterSummary, ContentItem, PopularContent, Teacher } from "@/lib/api";
import { teacherName } from "@/lib/api";

const SUBJECT_LABEL: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  biology: "Biology",
};

export function facultySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "teacher";
}

const CHAPTER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHAPTER_HEX8 = /^[0-9a-f]{8}$/i;

export function isOpaqueChapterLabel(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return true;
  return CHAPTER_UUID.test(raw) || CHAPTER_HEX8.test(raw);
}

export function teacherFromFaculty(row: AdminTeacher): Teacher {
  const subject = SUBJECT_LABEL[row.subject] || row.subject;
  return {
    id: row.id,
    bio: row.bio || null,
    subjects: [subject],
    badge: row.listed ? "Featured" : null,
    is_featured: Boolean(row.listed),
    image_url: null,
    years_experience: row.years_experience ?? USUAL_TEACHER_EXPERIENCE,
    selections_count: row.selections_count ?? USUAL_TEACHER_SELECTIONS,
    subject_focus: subject,
    full_name: row.name,
  };
}

export function isPlaceholderTeacher(teacher: Teacher) {
  const name = teacherName(teacher).toLowerCase();
  return name.includes("demo") || name.includes("placeholder") || name === "teacher";
}

export function teacherMatchesSubject(teacher: Teacher, subject: string | null | undefined) {
  if (!subject || subject === "All") return true;
  const needle = subject.toLowerCase();
  return (
    teacher.subject_focus?.toLowerCase() === needle ||
    (teacher.subjects || []).some((item) => item.toLowerCase() === needle)
  );
}

export function listedFacultyTeachers() {
  return SEEDED_TEACHERS.filter((row) => row.listed).map(teacherFromFaculty);
}

export function findFacultyTeacher(id: string, extras: AdminTeacher[] = []) {
  const pool = [...SEEDED_TEACHERS, ...extras];
  const slug = facultySlug(id);
  return (
    pool.find((row) => row.id === id || facultySlug(row.name) === slug || facultySlug(row.id) === slug) || null
  );
}

export function resolveCatalogFaculty(id: string, extras: AdminTeacher[] = [], liveName?: string | null) {
  return (
    findFacultyTeacher(id, extras) ||
    (liveName ? findFacultyTeacher(facultySlug(liveName), extras) : null) ||
    (liveName
      ? SEEDED_TEACHERS.find((row) => facultySlug(row.name) === facultySlug(liveName)) || null
      : null)
  );
}

export function teachersFromUploads(contents: AdminContent[]): AdminTeacher[] {
  const byId = new Map<string, AdminTeacher>();
  for (const item of contents) {
    const name = item.teacher?.trim();
    if (!name) continue;
    const id = facultySlug(name);
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name,
        subject: (item.subject || "physics").toLowerCase(),
        listed: true,
      });
    }
  }
  return [...byId.values()];
}

export function mergeTeacherLists(live: Teacher[], extra: Teacher[]) {
  const byName = new Map<string, Teacher>();
  for (const teacher of live) {
    if (isPlaceholderTeacher(teacher)) continue;
    byName.set(teacherName(teacher).trim().toLowerCase(), teacher);
  }
  for (const teacher of extra) {
    const key = teacherName(teacher).trim().toLowerCase();
    const current = byName.get(key);
    if (current) {
      byName.set(key, {
        ...current,
        ...teacher,
        id: teacher.id || current.id,
        years_experience: teacher.years_experience ?? current.years_experience ?? USUAL_TEACHER_EXPERIENCE,
        selections_count: teacher.selections_count ?? current.selections_count ?? USUAL_TEACHER_SELECTIONS,
      });
    } else {
      byName.set(key, {
        ...teacher,
        years_experience: teacher.years_experience ?? USUAL_TEACHER_EXPERIENCE,
        selections_count: teacher.selections_count ?? USUAL_TEACHER_SELECTIONS,
      });
    }
  }
  return [...byName.values()]
    .map((teacher) => ({
      ...teacher,
      years_experience: teacher.years_experience ?? USUAL_TEACHER_EXPERIENCE,
      selections_count: teacher.selections_count ?? USUAL_TEACHER_SELECTIONS,
    }))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
}

const CHAPTER_FAMILIES = [
  ["kinematics", "kinematics-2d", "kinematics-motion-in-2d", "motion-in-straight-line", "motion-in-plane", "motion-in-plane-point"],
  ["laws-of-motion", "laws-of-motion-friction"],
  ["rotational-motion", "rotational-dynamics-torque", "rotation", "rotational-dynamics"],
  ["thermodynamics-11", "thermal-properties-thermodynamics", "thermodynamics"],
];

export function chapterFamily(value: string) {
  const slug = facultySlug(value);
  const match = CHAPTERS.find((chapter) => chapter.id === value || chapter.id === slug || facultySlug(chapter.name) === slug);
  const id = match?.id || slug;
  const group = CHAPTER_FAMILIES.find((family) => family.includes(id) || family.includes(slug)) || [id];
  return new Set(group);
}

export function chapterRecord(value: string) {
  const raw = (value || "").trim();
  if (!raw || isOpaqueChapterLabel(raw)) {
    return { id: raw, title: "" };
  }
  const slug = facultySlug(raw);
  const match = CHAPTERS.find((chapter) => chapter.id === raw || chapter.id === slug || facultySlug(chapter.name) === slug);
  return {
    id: match?.id || slug,
    title: match?.name || raw,
  };
}

export function readableChapterTitle(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const record = chapterRecord(value || "");
    if (record.title) return record.title;
  }
  return "";
}

function chapterKeysForItem(item: AdminContent) {
  const title = readableChapterTitle(item.chapter, item.title);
  const chapter = chapterRecord(item.chapter || title);
  return [chapter.id, item.chapter_id, item.chapter, title, facultySlug(title)]
    .filter(Boolean)
    .map((value) => facultySlug(String(value)));
}

export function labelTeacherChapters(
  chapters: Array<{ chapter_id: string; title: string; videos: number; pdfs: number }>,
  contents: AdminContent[] = [],
) {
  const namedById = new Map<string, string>();
  for (const item of contents) {
    const named = readableChapterTitle(item.chapter);
    if (!named) continue;
    if (item.chapter_id) {
      namedById.set(item.chapter_id, named);
      namedById.set(item.chapter_id.slice(0, 8), named);
    }
  }
  const merged = new Map<string, { chapter_id: string; title: string; videos: number; pdfs: number }>();
  for (const chapter of chapters) {
    const fromUpload = contents.find(
      (item) =>
        item.chapter_id === chapter.chapter_id ||
        (chapter.chapter_id && item.chapter_id?.startsWith(chapter.chapter_id)) ||
        (chapter.title && item.chapter_id?.startsWith(chapter.title)),
    );
    const title =
      readableChapterTitle(
        chapter.title,
        namedById.get(chapter.chapter_id),
        namedById.get(chapter.chapter_id?.slice(0, 8)),
        fromUpload?.chapter,
        fromUpload?.title,
      ) || "Chapter";
    const id = !isOpaqueChapterLabel(chapter.chapter_id) ? chapter.chapter_id : facultySlug(title);
    const current = merged.get(id);
    if (!current) {
      merged.set(id, {
        chapter_id: id,
        title,
        videos: chapter.videos || 0,
        pdfs: chapter.pdfs || 0,
      });
      continue;
    }
    if (!isOpaqueChapterLabel(title)) current.title = title;
    current.videos = Math.max(current.videos, chapter.videos || 0);
    current.pdfs = Math.max(current.pdfs, chapter.pdfs || 0);
  }

  if (!contents.length) return [...merged.values()];

  const exact = new Map<string, { videos: number; pdfs: number; seen: Set<string> }>();
  for (const item of contents) {
    const keys = new Set(chapterKeysForItem(item));
    const id = [...merged.keys()].find(
      (chapterId) => keys.has(facultySlug(chapterId)) || keys.has(facultySlug(merged.get(chapterId)?.title || "")),
    );
    if (!id) continue;
    const bucket = exact.get(id) || { videos: 0, pdfs: 0, seen: new Set<string>() };
    const uniqueId = item.live_id || item.id;
    if (bucket.seen.has(uniqueId) || bucket.seen.has(item.id)) continue;
    bucket.seen.add(uniqueId);
    bucket.seen.add(item.id);
    if (item.type === "note_pdf" || item.module === "notes_pdf" || item.module === "important_pdfs") {
      bucket.pdfs += 1;
    } else {
      bucket.videos += 1;
    }
    exact.set(id, bucket);
  }

  return [...merged.values()].map((chapter) => {
    const counted = exact.get(chapter.chapter_id);
    if (!counted || counted.seen.size === 0) return chapter;
    return { ...chapter, videos: counted.videos, pdfs: counted.pdfs };
  });
}

function contentBelongsToTeacher(item: AdminContent, teacherId: string, liveName?: string | null) {
  const raw = item.teacher?.trim() || "";
  if (!raw) return false;
  const faculty = findFacultyTeacher(teacherId);
  const aliases = [teacherId, liveName, faculty?.id, faculty?.name, faculty ? facultySlug(faculty.name) : ""]
    .filter(Boolean)
    .map((value) => facultySlug(String(value)));
  const token = facultySlug(raw);
  return aliases.includes(token) || raw === teacherId || raw === liveName || raw === faculty?.name;
}

export function teacherUploads(
  contents: AdminContent[],
  teacherId: string,
  classLevel?: string | null,
  liveName?: string | null,
) {
  return contents.filter((item) => {
    if (!item.is_published) return false;
    if (item.destination_id && item.destination_id !== "top-teachers") return false;
    if (!contentBelongsToTeacher(item, teacherId, liveName)) return false;
    if (classLevel === "11" || classLevel === "12") {
      const stored = item.class_level || "";
      if (stored && stored !== classLevel && !(classLevel === "12" && stored === "dropper")) return false;
    }
    return true;
  });
}

export function toContentItem(item: AdminContent): ContentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    module: item.module,
    timeline: null,
    duration_sec: null,
    storage_path: item.storage_path,
    external_url: item.external_url,
    sort_order: 0,
    is_free_preview: item.is_free_preview,
  };
}

export function modulesPayload(teacher: Teacher, contents: AdminContent[], classLevel?: string | null) {
  const rows = teacherUploads(contents, teacher.id, classLevel, teacherName(teacher));
  const byChapter = new Map<string, ChapterSummary>();
  const popular: PopularContent[] = [];

  for (const item of rows) {
    const title = readableChapterTitle(item.chapter);
    if (!item.chapter && !item.chapter_id && !title) continue;
    const chapter = chapterRecord(item.chapter || title);
    const key = (!isOpaqueChapterLabel(chapter.id) && chapter.id) || item.chapter_id || item.chapter || item.id;
    const current = byChapter.get(key) || {
      chapter_id: key,
      title: title || "Chapter",
      videos: 0,
      pdfs: 0,
    };
    if (title) current.title = title;
    if (item.type === "note_pdf" || item.module === "notes_pdf" || item.module === "important_pdfs") {
      current.pdfs += 1;
    } else {
      current.videos += 1;
    }
    byChapter.set(key, current);
    if ((item.module === "lectures" || item.type === "video") && popular.length < 6) {
      popular.push({
        id: item.id,
        title: item.title,
        type: item.type,
        module: item.module,
        chapter_id: key,
        class_level: item.class_level,
        duration_sec: null,
        chapters: { title: current.title },
      });
    }
  }

  return {
    teacher,
    popular_content: popular,
    chapters: [...byChapter.values()],
    modules: [
      "lectures",
      "problem_solving",
      "pyqs_solving",
      "one_shots",
      "revision",
      "notes_pdf",
      "important_pdfs",
    ],
  };
}

export function chapterPayload(
  teacherId: string,
  chapterId: string,
  contents: AdminContent[],
  liveName?: string | null,
) {
  const rows = teacherUploads(contents, teacherId, null, liveName).filter((item) => {
    if (!item.chapter && !item.chapter_id) return false;
    const chapter = chapterRecord(item.chapter || "");
    return (
      chapter.id === chapterId ||
      item.chapter_id === chapterId ||
      facultySlug(item.chapter || "") === chapterId ||
      (item.chapter_id && chapterId && item.chapter_id.startsWith(chapterId))
    );
  });
  const items = rows.map(toContentItem);
  const modules: Record<string, ContentItem[]> = {};
  for (const item of items) {
    const key = item.module || item.type;
    if (!modules[key]) modules[key] = [];
    modules[key].push(item);
  }
  return { teacher_id: teacherId, chapter_id: chapterId, modules, items };
}
