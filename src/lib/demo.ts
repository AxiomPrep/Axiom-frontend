import { ChapterSummary, ContentItem, PopularContent, Teacher } from "@/lib/api";

export const DEMO_TEACHERS: Teacher[] = [
  {
    id: "demo-abj",
    bio: "Physics faculty known for Mechanics and electrodynamics.",
    subjects: ["Physics"],
    badge: "IIT",
    is_featured: true,
    image_url: null,
    years_experience: 16,
    selections_count: 12000,
    subject_focus: "Physics",
    full_name: "ABJ Sir",
  },
  {
    id: "demo-gb",
    bio: null,
    subjects: ["Mathematics"],
    badge: null,
    is_featured: true,
    image_url: null,
    years_experience: 24,
    selections_count: 15000,
    subject_focus: "Mathematics",
    full_name: "GB Sir",
  },
  {
    id: "demo-ns",
    bio: null,
    subjects: ["Biology"],
    badge: null,
    is_featured: true,
    image_url: null,
    years_experience: 18,
    selections_count: 10000,
    subject_focus: "Biology",
    full_name: "NS Sir",
  },
  {
    id: "demo-vj",
    bio: null,
    subjects: ["Chemistry"],
    badge: null,
    is_featured: true,
    image_url: null,
    years_experience: 20,
    selections_count: 14000,
    subject_focus: "Chemistry",
    full_name: "VJ Sir",
  },
  {
    id: "demo-nv",
    bio: null,
    subjects: ["Physics"],
    badge: null,
    is_featured: true,
    image_url: null,
    years_experience: 22,
    selections_count: 20000,
    subject_focus: "Physics",
    full_name: "NV Sir",
  },
];

export const DEMO_CHAPTERS: ChapterSummary[] = [
  { chapter_id: "demo-kinematics", title: "Kinematics (1D & 2D)", videos: 24, pdfs: 12 },
  { chapter_id: "demo-nlm", title: "Newton's Laws of Motion", videos: 18, pdfs: 8 },
  { chapter_id: "demo-rotation", title: "Rotational Motion", videos: 21, pdfs: 9 },
];

export const DEMO_POPULAR: PopularContent[] = [
  {
    id: "demo-mechanics-marathon",
    title: "Mechanics Marathon",
    type: "video",
    module: "lectures",
    chapter_id: "demo-rotation",
    class_level: "11",
    duration_sec: 43200,
    chapters: { title: "12 Hour complete masterclass for JEE Adv." },
  },
  {
    id: "demo-electro",
    title: "Electrodynamics Series",
    type: "video",
    module: "lectures",
    chapter_id: "demo-kinematics",
    class_level: "12",
    duration_sec: 36000,
    chapters: { title: "Most watched YT series for Class 12 concepts." },
  },
];

export const DEMO_ITEMS: ContentItem[] = [
  {
    id: "demo-mechanics-marathon",
    title: "Mechanics Marathon",
    description: "Complete rotational mechanics lecture with board notes.",
    type: "video",
    module: "lectures",
    timeline: [
      { label: "Introduction", time_sec: 0 },
      { label: "Torque & Angular Momentum", time_sec: 720 },
      { label: "Rolling without slipping", time_sec: 1800 },
    ],
    duration_sec: 5400,
    storage_path: null,
    external_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/ogg/sample1.ogv",
    sort_order: 1,
    is_free_preview: true,
  },
  {
    id: "demo-ps-1",
    title: "Rotational Motion Problem Set",
    description: "Guided problem solving",
    type: "video",
    module: "problem_solving",
    timeline: [],
    duration_sec: 2400,
    storage_path: null,
    external_url: null,
    sort_order: 1,
    is_free_preview: true,
  },
  {
    id: "demo-notes",
    title: "Class notes — Rotational Motion",
    description: "PDF notes",
    type: "note_pdf",
    module: "notes_pdf",
    timeline: [],
    duration_sec: null,
    storage_path: null,
    external_url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf",
    sort_order: 1,
    is_free_preview: true,
  },
];

export function demoTeacher(id: string) {
  return DEMO_TEACHERS.find((t) => t.id === id) || DEMO_TEACHERS[0];
}

export function demoModules() {
  const grouped: Record<string, ContentItem[]> = {};
  for (const item of DEMO_ITEMS) {
    const key = item.module || item.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  return grouped;
}

export function demoContent(id: string) {
  return (
    DEMO_ITEMS.find((c) => c.id === id) ||
    DEMO_POPULAR.find((c) => c.id === id) ||
    DEMO_ITEMS[0]
  );
}
