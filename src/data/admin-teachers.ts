export type AdminTeacher = {
  id: string;
  name: string;
  subject: string;
  bio?: string;
  years_experience?: number;
  selections_count?: number;
  /** When true, the teacher is listed on the student Top Teachers page. */
  listed?: boolean;
};

/** Usual teaching years when a teacher has no stored figure. */
export const USUAL_TEACHER_EXPERIENCE = 5;

/** Usual IIT/NIT or NEET selections when a teacher has no stored figure. */
export const USUAL_TEACHER_SELECTIONS = 40;

/** Teachers shown in the admin Top Teachers dropdown. Edit this list to add faculty. */
export const SEEDED_TEACHERS: AdminTeacher[] = [
  { id: "abj-sir", name: "ABJ Sir", subject: "physics", bio: "Co-founder of Competishun", years_experience: 12, selections_count: 480, listed: true },
  { id: "gb-sir", name: "GB Sir", subject: "physics", bio: "Co-founder of IIT School", years_experience: 12, selections_count: 450, listed: true },
  {
    id: "vanshu-sharma",
    name: "Vanshu Sharma",
    subject: "mathematics",
    bio: "NIT Trichy Mechanical. 99.27%ile JEE Main after a drop year. Teaches Maths on Filo and mentors students on prep strategy.",
    years_experience: 3,
    selections_count: 35,
    listed: true,
  },
  {
    id: "lokanath-panda",
    name: "Lokanath Panda",
    subject: "mathematics",
    bio: "Final-year Statistics at ISI Kolkata. 99.94%ile JEE Main and AIR 56 in the 2024 ISI entrance.",
    years_experience: 3,
    selections_count: 30,
    listed: true,
  },
  {
    id: "ayush-raj",
    name: "Ayush Raj",
    subject: "physics",
    bio: "JEE mentor for concept clearing, doubt solving, and daily practice.",
    years_experience: 4,
    selections_count: 45,
    listed: true,
  },
  {
    id: "ram-singh",
    name: "Ram Singh",
    subject: "physics",
    bio: "1st-year Mechanical Engineering at NIT Silchar. Mentors JEE students on concepts and problem solving.",
    years_experience: 2,
    selections_count: 20,
    listed: true,
  },
  { id: "neha-agrawal", name: "Neha Agrawal", subject: "mathematics", years_experience: 8, selections_count: 180, listed: true },
  { id: "sameer-chincholkar", name: "Sameer Chincholkar", subject: "mathematics", years_experience: 7, selections_count: 140, listed: true },
  { id: "mc-sir", name: "MC Sir", subject: "mathematics", years_experience: 10, selections_count: 220, listed: true },
  { id: "ashish-agrawal", name: "Ashish Agrawal", subject: "mathematics", years_experience: 8, selections_count: 160, listed: true },
  { id: "tarun-khandelwal", name: "Tarun Khandelwal", subject: "mathematics", years_experience: 7, selections_count: 130, listed: true },
  { id: "mohit-tyagi", name: "Mohit Tyagi", subject: "mathematics", years_experience: 12, selections_count: 420, listed: true },
  { id: "chemistry-faculty", name: "Chemistry faculty", subject: "chemistry", years_experience: 6, selections_count: 80 },
  { id: "maths-faculty", name: "Mathematics faculty", subject: "mathematics", years_experience: 6, selections_count: 80 },
  { id: "biology-faculty", name: "Biology faculty", subject: "biology", years_experience: 6, selections_count: 80 },
];

export function mergeFacultyLists(seed: AdminTeacher[], extra: AdminTeacher[] = []) {
  const byName = new Map<string, AdminTeacher>();
  const put = (row: AdminTeacher, preferId?: boolean) => {
    const key = row.name.trim().toLowerCase();
    if (!key) return;
    const current = byName.get(key);
    if (!current) {
      byName.set(key, row);
      return;
    }
    byName.set(key, {
      ...current,
      ...row,
      id: preferId ? row.id : current.id || row.id,
      listed: row.listed ?? current.listed,
    });
  };
  for (const row of extra) put(row);
  for (const row of seed) put(row, true);
  return [...byName.values()];
}

export function teachersForSubject(teachers: AdminTeacher[], subjectId: string) {
  return [...teachers].sort((a, b) => {
    const am = a.subject === subjectId ? 0 : 1;
    const bm = b.subject === subjectId ? 0 : 1;
    if (am !== bm) return am - bm;
    return a.name.localeCompare(b.name);
  });
}
