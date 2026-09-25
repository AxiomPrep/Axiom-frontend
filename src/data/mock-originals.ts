import { CHAPTERS, MOCK_QUESTIONS } from "@/data/mockCurriculum";
import { CHAPTER_MODULES } from "@/lib/catalog";

function subjectName(id: string) {
  return ({ physics: "Physics", chemistry: "Chemistry", mathematics: "Mathematics", biology: "Biology" } as Record<string, string>)[
    id
  ] || id;
}

export function mockTopModules(filters: { subject?: string | null; classLevel?: string | null; chapter?: string | null }) {
  const subject = (filters.subject || "").toLowerCase();
  const klass = filters.classLevel === "12" ? "12" : filters.classLevel === "11" ? "11" : "";
  const chapter = (filters.chapter || "").toLowerCase();
  const pool = CHAPTERS.filter((row) => {
    if (subject && row.subjectId !== subject && !subject.includes(row.subjectId)) return false;
    if (klass && row.classNum !== klass) return false;
    if (chapter && row.id !== chapter && !row.name.toLowerCase().includes(chapter)) return false;
    return true;
  });
  const chapters = (chapter ? pool : pool.slice(0, 3)).slice(0, 4);
  return chapters.flatMap((row) =>
    CHAPTER_MODULES.map((mod) => ({
      id: `mock_${row.id}_${mod.key}`,
      title: `${mod.title}: ${row.name}`,
      description: `${mod.subtitle} for ${row.name}. Sample module from the prep library.`,
      class_level: row.classNum,
      content_id: mod.key === "notes_pdf" || mod.key === "important_pdfs" ? null : `mock_${row.id}_${mod.key}`,
      test_id: null,
      module: mod.key,
      item: {
        id: `mock_${row.id}_${mod.key}`,
        title: `${mod.title} · ${row.name}`,
        description: mod.subtitle,
        type: mod.key === "notes_pdf" || mod.key === "important_pdfs" ? "note_pdf" : "video",
        module: mod.key,
        timeline: [],
        duration_sec: 18 * 60,
        storage_path: null,
        external_url: null,
        sort_order: 0,
        is_free_preview: true,
      },
      chapters: { title: row.name, class_level: row.classNum },
      subjects: { name: subjectName(row.subjectId), slug: row.subjectId },
    })),
  );
}

export function mockNamedQuizzes(chapterId?: string | null) {
  const chapter = CHAPTERS.find((row) => row.id === chapterId) || CHAPTERS[0];
  return [
    {
      id: `mock_quiz_s1_${chapter.id}`,
      title: `${chapter.name} · S1 Concept Drill`,
      quiz_tier: "s1",
      question_count: 25,
      duration_sec: 25 * 60,
    },
    {
      id: `mock_quiz_s2_${chapter.id}`,
      title: `${chapter.name} · S2 Speed Set`,
      quiz_tier: "s2",
      question_count: 25,
      duration_sec: 30 * 60,
    },
    {
      id: `mock_quiz_d1_${chapter.id}`,
      title: `${chapter.name} · D1 Advanced Warm-up`,
      quiz_tier: "d1",
      question_count: 20,
      duration_sec: 40 * 60,
    },
    {
      id: `mock_quiz_named_${chapter.id}`,
      title: `${chapter.name} Weekend Championship`,
      quiz_tier: "named",
      question_count: 30,
      duration_sec: 45 * 60,
    },
  ];
}

export function mockQuizTiers(chapterId?: string | null) {
  const named = mockNamedQuizzes(chapterId);
  return [
    { key: "s1", name: "S1 — Easy Level", purpose: "Foundational JEE Mains / NEET", default_limit: 25, available_tests: 2 },
    { key: "s2", name: "S2 — Tough Level", purpose: "Challenging Mains and toughest NEET", default_limit: 25, available_tests: 2 },
    { key: "d1", name: "D1 — Advanced Easy", purpose: "Entry-level JEE Advanced", default_limit: 20, available_tests: 1 },
    { key: "d2", name: "D2 — Advanced Tough", purpose: "Hardest JEE Advanced tier", default_limit: 15, available_tests: 1 },
  ].map((tier) => ({
    ...tier,
    available_tests: named.filter((item) => item.quiz_tier === tier.key).length || tier.available_tests,
  }));
}

export function mockTopTests() {
  return [
    {
      id: "mock_fst_jee_main_01",
      title: "JEE Main Full Syllabus Mock 01",
      exam_pattern: "jee_main",
      total_marks: 300,
      duration_sec: 3 * 60 * 60,
      question_count: 90,
      href: "/practice/player?subject=physics&class=12&chapter=electrostatics&tier=3&tierName=JEE%20Main%20FST%2001",
    },
    {
      id: "mock_fst_jee_main_02",
      title: "JEE Main Full Syllabus Mock 02",
      exam_pattern: "jee_main",
      total_marks: 300,
      duration_sec: 3 * 60 * 60,
      question_count: 90,
      href: "/practice/player?subject=chemistry&class=12&chapter=coordination-compounds&tier=3&tierName=JEE%20Main%20FST%2002",
    },
    {
      id: "mock_fst_neet_01",
      title: "NEET UG Full Syllabus Mock 01",
      exam_pattern: "neet",
      total_marks: 720,
      duration_sec: 3 * 60 * 60,
      question_count: 180,
      href: "/practice/player?subject=biology&class=12&chapter=genetics-evolution&tier=2&tierName=NEET%20FST%2001",
    },
    {
      id: "mock_fst_adv_01",
      title: "JEE Advanced Paper 1 Simulation",
      exam_pattern: "jee_adv",
      total_marks: 180,
      duration_sec: 3 * 60 * 60,
      question_count: 54,
      href: "/practice/player?subject=mathematics&class=12&chapter=integral-calculus&tier=5&tierName=JEE%20Advanced%20P1",
    },
    {
      id: "mock_fst_adv_02",
      title: "JEE Advanced Paper 2 Simulation",
      exam_pattern: "jee_adv",
      total_marks: 180,
      duration_sec: 3 * 60 * 60,
      question_count: 54,
      href: "/practice/player?subject=physics&class=11&chapter=rotational-motion&tier=5&tierName=JEE%20Advanced%20P2",
    },
  ];
}

export function mockStudySequences() {
  return [
    {
      id: "goal-air",
      slug: "air-1000",
      title: "AIR under 1000",
      goal_key: "rank",
      description: "Finish lectures, then mixed PYQs, then full syllabus tests.",
      steps: [
        { step: 1, action: "Close every chapter lecture + notes PDF" },
        { step: 2, action: "S1 then S2 quizzes until accuracy holds" },
        { step: 3, action: "Weekly FST; log misses in Improvement Book" },
      ],
    },
    {
      id: "goal-mains",
      slug: "mains-95",
      title: "95 percentile JEE Mains",
      goal_key: "mains",
      description: "Speed and coverage over depth. One-shots, then Mains PYQs, then timed S2.",
      steps: [
        { step: 1, action: "One-shots for remaining chapters" },
        { step: 2, action: "10 Mains PYQs after each lecture" },
        { step: 3, action: "Two custom tests per week at 25–40 Q" },
      ],
    },
    {
      id: "goal-neet",
      slug: "neet-650",
      title: "NEET 650+",
      goal_key: "neet",
      description: "NCERT first, then NEET PYQ bridge, then diagrams from Important Tools.",
      steps: [
        { step: 1, action: "NCERT shelf with highlights for Bio + Chem" },
        { step: 2, action: "NEET 10 after every lecture" },
        { step: 3, action: "Diagram + formula sheets before sleep" },
      ],
    },
    {
      id: "goal-crunch",
      slug: "two-month",
      title: "Two-month crunch",
      goal_key: "sprint",
      description: "Revision series, important PDFs, and FSTs only.",
      steps: [
        { step: 1, action: "Revision series + important PDFs per chapter" },
        { step: 2, action: "Daily timer blocks by subject" },
        { step: 3, action: "FST every Sunday; Improvement Book every night" },
      ],
    },
  ];
}

export function mockPrerequisiteSequence(chapterId: string) {
  const target = CHAPTERS.find((row) => row.id === chapterId) || CHAPTERS[0];
  const prior = CHAPTERS.filter((row) => row.subjectId === target.subjectId && row.id !== target.id).slice(0, 3);
  const sequence = [...prior, target].map((row, index) => ({
    sort_order: index,
    chapter: { id: row.id, title: row.name, class_level: row.classNum },
  }));
  return {
    target: { id: target.id, title: target.name, class_level: target.classNum },
    message: `Finish these ${prior.length} chapters before ${target.name}. Sample path from the prep library.`,
    sequence,
  };
}

export function mockPrepTracker(filters: { subject?: string | null; classLevel?: string | null }) {
  const subject = (filters.subject || "").toLowerCase();
  const klass = filters.classLevel === "12" ? "12" : filters.classLevel === "11" ? "11" : "";
  const rows = CHAPTERS.filter((row) => {
    if (subject && row.subjectId !== subject) return false;
    if (klass && row.classNum !== klass) return false;
    return true;
  }).slice(0, 12);
  return rows.map((row, index) => {
    const pct = [72, 48, 91, 33, 60, 15][index % 6];
    const status = pct >= 80 ? "done" : pct >= 40 ? "in_progress" : "todo";
    return {
      chapter_id: row.id,
      title: row.name,
      class_level: row.classNum,
      completion_pct: pct,
      lectures: { status, done: Math.round((pct / 100) * 8), total: 8 },
      practice: { status: pct >= 50 ? "done" : status },
      pyqs: { status: pct >= 70 ? "done" : "todo" },
      subject: { name: subjectName(row.subjectId), slug: row.subjectId },
    };
  });
}

export function mockImprovementBook(source?: string | null) {
  const mistakes = MOCK_QUESTIONS.slice(0, 5).map((question, index) => {
    const bucket = (["practice", "pyq", "quiz", "test", "module"] as const)[index % 5];
    return {
      id: `mock_miss_${question.id}`,
      source: bucket,
      selected_answer: "C",
      answered_at: new Date(Date.now() - index * 86400000).toISOString(),
      questions: {
        stem: question.question,
        difficulty: question.difficulty,
        exam: bucket === "pyq" ? "JEE Main 2024" : "Practice",
        explanation: question.explanation,
        correct_answer: question.correctOption,
      },
    };
  });
  const filtered = source ? mistakes.filter((row) => row.source.includes(source)) : mistakes;
  return {
    mistakes: filtered,
    by_source: {
      test_mistakes: mistakes.filter((row) => row.source === "test"),
      quiz_test_mistakes: mistakes.filter((row) => row.source === "quiz"),
      module_mistakes: mistakes.filter((row) => row.source === "module"),
      practice_mistakes: mistakes.filter((row) => row.source === "practice"),
      pyq_mistakes: mistakes.filter((row) => row.source === "pyq"),
    },
    total: filtered.length,
  };
}
