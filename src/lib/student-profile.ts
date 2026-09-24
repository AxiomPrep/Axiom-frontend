export const CLASS_LEVELS = ["11", "12", "dropper"] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

export const EXAM_INTERESTS = ["jee", "neet", "olympiad"] as const;
export type ExamInterest = (typeof EXAM_INTERESTS)[number];

export const EXAM_INTEREST_LABELS: Record<ExamInterest, string> = {
  jee: "JEE",
  neet: "NEET",
  olympiad: "Olympiad",
};

export function isClassLevel(value: unknown): value is ClassLevel {
  return value === "11" || value === "12" || value === "dropper";
}

export function parseExamInterests(value: unknown): ExamInterest[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ExamInterest =>
    item === "jee" || item === "neet" || item === "olympiad",
  );
}

export function examTrackFromInterests(interests: ExamInterest[]): "jee" | "neet" | "both" {
  const hasJee = interests.includes("jee");
  const hasNeet = interests.includes("neet");
  if (hasJee && !hasNeet) return "jee";
  if (hasNeet && !hasJee) return "neet";
  return "both";
}

export function targetExamFromInterests(interests: ExamInterest[]) {
  if (interests.includes("jee") && interests.includes("neet")) return "JEE + NEET";
  if (interests.includes("jee")) return "JEE";
  if (interests.includes("neet")) return "NEET";
  if (interests.includes("olympiad")) return "Olympiad";
  return "JEE";
}

export function interestsFromTargetExam(value: string | null | undefined): ExamInterest[] {
  const raw = String(value || "").toLowerCase();
  const found: ExamInterest[] = [];
  if (raw.includes("jee")) found.push("jee");
  if (raw.includes("neet")) found.push("neet");
  if (raw.includes("olympiad")) found.push("olympiad");
  return found;
}

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return raw.trim();
}

export function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

export function classLabel(level: ClassLevel) {
  if (level === "11") return "Class 11";
  if (level === "12") return "Class 12";
  return "Dropper";
}
