import { CHAPTERS } from "@/data/mockCurriculum";
import { SEEDED_TEACHERS, type AdminTeacher } from "@/data/admin-teachers";
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

export function teacherFromFaculty(row: AdminTeacher): Teacher {
  const subject = SUBJECT_LABEL[row.subject] || row.subject;
  return {
    id: row.id,
    bio: row.bio || null,
    subjects: [subject],
    badge: row.listed ? "Featured" : null,
    is_featured: Boolean(row.listed),
    image_url: null,
    years_experience: null,
    selections_count: null,
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
    if (item.destination_id && item.destination_id !== "top-teachers") continue;
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
      byName.set(key, { ...current, ...teacher, id: teacher.id || current.id });
    } else {
      byName.set(key, teacher);
    }
  }
  return [...byName.values()].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
}

export function chapterRecord(value: string) {
  const slug = facultySlug(value);
  const match = CHAPTERS.find((chapter) => chapter.id === value || facultySlug(chapter.name) === slug);
  return {
    id: match?.id || slug,
    title: match?.name || value,
  };
}

function contentBelongsToTeacher(item: AdminContent, teacherId: string) {
  const raw = item.teacher?.trim() || "";
  if (!raw) return false;
  const faculty = findFacultyTeacher(teacherId);
  const aliases = [teacherId, faculty?.id, faculty?.name, faculty ? facultySlug(faculty.name) : ""]
    .filter(Boolean)
    .map((value) => facultySlug(String(value)));
  const token = facultySlug(raw);
  return aliases.includes(token) || raw === teacherId || raw === faculty?.name;
}

export function teacherUploads(contents: AdminContent[], teacherId: string, classLevel?: string | null) {
  return contents.filter((item) => {
    if (!item.is_published) return false;
    if (item.destination_id && item.destination_id !== "top-teachers") return false;
    if (!contentBelongsToTeacher(item, teacherId)) return false;
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
  const rows = teacherUploads(contents, teacher.id, classLevel);
  const byChapter = new Map<string, ChapterSummary>();
  const popular: PopularContent[] = [];

  for (const item of rows) {
    if (!item.chapter) continue;
    const chapter = chapterRecord(item.chapter);
    const current = byChapter.get(chapter.id) || { chapter_id: chapter.id, title: chapter.title, videos: 0, pdfs: 0 };
    if (item.type === "note_pdf" || item.module === "notes_pdf" || item.module === "important_pdfs") {
      current.pdfs += 1;
    } else {
      current.videos += 1;
    }
    byChapter.set(chapter.id, current);
    if ((item.module === "lectures" || item.type === "video") && popular.length < 6) {
      popular.push({
        id: item.id,
        title: item.title,
        type: item.type,
        module: item.module,
        chapter_id: chapter.id,
        class_level: item.class_level,
        duration_sec: null,
        chapters: { title: chapter.title },
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

export function chapterPayload(teacherId: string, chapterId: string, contents: AdminContent[]) {
  const rows = teacherUploads(contents, teacherId).filter((item) => {
    if (!item.chapter) return false;
    const chapter = chapterRecord(item.chapter);
    return chapter.id === chapterId || facultySlug(item.chapter) === chapterId;
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
