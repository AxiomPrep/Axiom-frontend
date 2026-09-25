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
  pyq: "PYQs",
  important_laws: "Important Laws",
  important_methods: "Important Methods",
  important_reactions: "Important Reactions",
  roadmap_problems: "Roadmap Problems",
  biology_diagrams: "Biology Diagrams",
};

const PRACTICE_TITLES_NOT_IN_ORIGINALS = [
  "Binomial & Normal Distribution",
  "Probability & Random Variables",
  "Differential Equations",
  "Integration & Definite Integrals",
  "Differentiation & Its Applications",
  "Introduction to Limits & Continuity",
  "Coordinate Geometry & Conic Sections",
  "Trigonometric Identities & Equations",
  "Pythagoras' Theorem & Trigonometric Ratios",
  "Logarithms & Matrices",
  "Polynomials & Quadratic Equations",
  "Basic Algebraic Techniques & Indices",
  "Alcohol Phenols & Ethers",
  "Coordination Compounds",
  "D-F Block",
  "Chemical Kinetics",
  "Motion in straight line",
  "Motion in Plane Point",
  "Unit and dimensions",
  "Lupac chemistry",
  "Sequence and series",
  "Chemical control and integration",
  "Integration",
];

function toolText(value?: string | null) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isHiddenFromOriginalsTools(title?: string | null) {
  const key = toolText(title);
  return Boolean(key) && PRACTICE_TITLES_NOT_IN_ORIGINALS.some((name) => toolText(name) === key);
}

export function inferToolKind(opts: {
  tool_kind?: string | null;
  title?: string | null;
  description?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
}) {
  const stored = (opts.tool_kind || "").trim().replace(/-/g, "_");
  if (stored === "mind_map" || stored === "mindmaps") return "mindmap";
  if (stored && TOOL_KIND_LABELS[stored]) return stored;
  const hay = `${opts.title || ""} ${opts.description || ""} ${opts.file_name || ""} ${opts.storage_path || ""}`.toLowerCase();
  if (/\bpyqs?\b/.test(hay) || hay.includes("previous year")) return "pyq";
  if (hay.includes("full note") || hay.includes("full fledged") || hay.includes("full-fledge")) return "full_notes";
  if (hay.includes("formula")) return "formula_sheet";
  if (hay.includes("mindmap") || hay.includes("mind map")) return "mindmap";
  if (hay.includes("short note")) return "short_notes";
  if (hay.includes("important law") || hay.includes("laws")) return "important_laws";
  if (hay.includes("important method") || hay.includes("methods")) return "important_methods";
  if (hay.includes("reaction")) return "important_reactions";
  if (hay.includes("diagram")) return "biology_diagrams";
  if (hay.includes("roadmap")) return "roadmap_problems";
  return stored;
}
