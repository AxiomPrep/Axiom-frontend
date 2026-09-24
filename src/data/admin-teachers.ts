export type AdminTeacher = {
  id: string;
  name: string;
  subject: string;
  bio?: string;
  /** When true, the teacher is listed on the student Top Teachers page. */
  listed?: boolean;
};

/** Teachers shown in the admin Top Teachers dropdown. Edit this list to add faculty. */
export const SEEDED_TEACHERS: AdminTeacher[] = [
  { id: "abj-sir", name: "ABJ Sir", subject: "physics", bio: "Co-founder of Competishun", listed: true },
  { id: "gb-sir", name: "GB Sir", subject: "physics", bio: "Co-founder of IIT School", listed: true },
  {
    id: "vanshu-sharma",
    name: "Vanshu Sharma",
    subject: "mathematics",
    bio: "NIT Trichy Mechanical. 99.27%ile JEE Main after a drop year. Teaches Maths on Filo and mentors students on prep strategy.",
    listed: true,
  },
  {
    id: "lokanath-panda",
    name: "Lokanath Panda",
    subject: "mathematics",
    bio: "Final-year Statistics at ISI Kolkata. 99.94%ile JEE Main and AIR 56 in the 2024 ISI entrance.",
    listed: true,
  },
  {
    id: "ayush-raj",
    name: "Ayush Raj",
    subject: "physics",
    bio: "JEE mentor for concept clearing, doubt solving, and daily practice.",
    listed: true,
  },
  {
    id: "ram-singh",
    name: "Ram Singh",
    subject: "physics",
    bio: "1st-year Mechanical Engineering at NIT Silchar. Mentors JEE students on concepts and problem solving.",
    listed: true,
  },
  { id: "chemistry-faculty", name: "Chemistry faculty", subject: "chemistry" },
  { id: "maths-faculty", name: "Mathematics faculty", subject: "mathematics" },
  { id: "biology-faculty", name: "Biology faculty", subject: "biology" },
];

export function teachersForSubject(teachers: AdminTeacher[], subjectId: string) {
  const match = teachers.filter((teacher) => teacher.subject === subjectId);
  return match.length ? match : teachers;
}
