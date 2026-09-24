export const SUBJECT_FILTERS = ["All", "Physics", "Chemistry", "Mathematics", "Biology"] as const;

export const CHAPTER_MODULES = [
  {
    key: "lectures",
    title: "Lectures",
    subtitle: "Detailed Theory",
  },
  {
    key: "problem_solving",
    title: "Problem Solving",
    subtitle: "Guided Practice",
  },
  {
    key: "pyqs_solving",
    title: "PYQs Solving",
    subtitle: "Past Year Qs",
  },
  {
    key: "one_shots",
    title: "One Shots",
    subtitle: "Quick Grasp",
  },
  {
    key: "revision",
    title: "Revision Series",
    subtitle: "Pre-Exam Polish",
  },
  {
    key: "notes_pdf",
    title: "Notes PDF",
    subtitle: "Class Notes",
  },
  {
    key: "important_pdfs",
    title: "Important PDFs",
    subtitle: "DPPs, Formula Sheets & Short Notes",
    wide: true,
  },
] as const;

export const ORIGINALS_TILES = [
  {
    id: "tools",
    href: "/originals/tools",
    title: "Important Tools",
    subtitle: "Mindmaps, formula sheets, notes & diagrams",
  },
  {
    id: "modules",
    href: "/originals/modules",
    title: "Top Modules",
    subtitle: "Chapter-wise flagship learning modules",
  },
  {
    id: "quizzes",
    href: "/originals/quizzes",
    title: "Quiz Tests",
    subtitle: "S1 / S2 / D1 / D2 + named quizzes",
  },
  {
    id: "custom-test",
    href: "/originals/custom-test",
    title: "Guidance Test Builder",
    subtitle: "Build a level-based custom test",
  },
  {
    id: "improvement-book",
    href: "/originals/improvement-book",
    title: "Improvement Book",
    subtitle: "Wrong questions grouped by source",
  },
  {
    id: "prep-tracker",
    href: "/originals/prep-tracker",
    title: "Prep Tracker",
    subtitle: "Lectures, practice and PYQ completion",
  },
  {
    id: "prerequisites",
    href: "/originals/prerequisites",
    title: "Prerequisite Mapping",
    subtitle: "What to finish before a chapter",
  },
  {
    id: "study-hub",
    href: "/study-hub",
    title: "Study Hub",
    subtitle: "Timer, daily to-do, and NCERT shelf",
  },
  {
    id: "study-sequences",
    href: "/originals/study-sequences",
    title: "Study Sequences",
    subtitle: "Goal-based study paths",
  },
  {
    id: "top-tests",
    href: "/originals/top-tests",
    title: "Top Tests / FST",
    subtitle: "Full syllabus tests on NTA/JAB patterns",
  },
  {
    id: "community",
    href: "/originals/community",
    title: "Axiom Prep Community",
    subtitle: "Discord doubt-solving and mentorship",
  },
] as const;

export const TOOL_KIND_LABELS: Record<string, string> = {
  mindmap: "Mindmaps",
  short_notes: "Short Notes",
  formula_sheet: "Formula Sheets",
  full_notes: "Full Notes",
  important_laws: "Important Laws",
  important_methods: "Important Methods",
  important_reactions: "Important Reactions",
  roadmap_problems: "Roadmap Problems",
  biology_diagrams: "Biology Diagrams",
};
