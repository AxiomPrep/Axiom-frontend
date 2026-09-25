import type { ExtractedQuestion } from "@/lib/admin";

export type IngestResult = {
  kind: "questions" | "notes";
  questions: ExtractedQuestion[];
  summary: string;
};

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

function asLetter(value: string | undefined): Letter {
  const raw = (value || "").trim().toUpperCase();
  if (raw === "1" || raw === "A") return "A";
  if (raw === "2" || raw === "B") return "B";
  if (raw === "3" || raw === "C") return "C";
  if (raw === "4" || raw === "D") return "D";
  return "A";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function emptyOptions(): ExtractedQuestion["options"] {
  return LETTERS.map((id) => ({ id, text: "" }));
}

export function detectPdfKind(text: string): "questions" | "notes" {
  const qMarks = text.match(/(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}[\).:\-]|Q\d{1,3}\b/gi) || [];
  const options = text.match(/(?:^|\n)\s*(?:\([1-4A-Da-d]\)|[1-4A-Da-d][\).])/g) || [];
  const hasAnswer = /answer(?:ed)?\s*[:\-]|correct\s*(?:option|answer)/i.test(text);
  if (qMarks.length >= 2 && options.length >= 6) return "questions";
  if (qMarks.length >= 1 && options.length >= 4 && hasAnswer) return "questions";
  return "notes";
}

function pageForStem(pages: { page: number; text: string }[], stem: string) {
  const needle = cleanText(stem).slice(0, 40).toLowerCase();
  if (!needle) return pages[0]?.page || 1;
  const hit = pages.find((row) => row.text.toLowerCase().includes(needle));
  return hit?.page || pages[0]?.page || 1;
}

function parseQuestionBlock(raw: string, index: number, pages: { page: number; text: string }[], sourcePdf: string | null): ExtractedQuestion | null {
  const block = raw.replace(/\r/g, "").trim();
  if (!block) return null;

  const answerMatch = block.match(/answer(?:ed)?\s*[:\-–]?\s*(?:\(?([1-4A-Da-d])\)?)/i);
  const solutionSplit = block.split(/sol+ution\s*[:\-–]?\s*/i);
  const beforeSolution = solutionSplit[0] || block;
  const explanation = cleanText(solutionSplit.slice(1).join(" ").replace(/^answer(?:ed)?\s*[:\-–]?.*/i, ""));

  const optionRe = /(?:^|\n)\s*(?:\(([1-4A-Da-d])\)|([1-4A-Da-d])[\).])\s*/g;
  const parts: { key: string; start: number; bodyStart: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = optionRe.exec(beforeSolution))) {
    parts.push({
      key: match[1] || match[2] || "",
      start: match.index,
      bodyStart: match.index + match[0].length,
    });
  }

  const options = emptyOptions();
  let stemSource = beforeSolution;
  if (parts.length >= 2) {
    stemSource = beforeSolution.slice(0, parts[0].start);
    parts.forEach((part, i) => {
      const end = i + 1 < parts.length ? parts[i + 1].start : beforeSolution.length;
      const letter = asLetter(part.key);
      const text = cleanText(
        beforeSolution
          .slice(part.bodyStart, end)
          .replace(/answer(?:ed)?\s*[:\-–]?.*/i, ""),
      );
      const slot = options.find((opt) => opt.id === letter);
      if (slot) slot.text = text;
    });
  }

  const stem = cleanText(stemSource.replace(/^(?:Q(?:uestion)?\s*)?\d{1,3}[\).:\-]\s*/i, ""));
  if (!stem && options.every((opt) => !opt.text)) return null;

  return {
    id: `q_${index + 1}`,
    stem: stem || `Question ${index + 1}`,
    options,
    correctOption: asLetter(answerMatch?.[1]),
    explanation,
    page: pageForStem(pages, stem || `Question ${index + 1}`),
    source_pdf: sourcePdf,
  };
}

export function parsePdfQuestions(pages: { page: number; text: string }[], sourcePdf: string | null): ExtractedQuestion[] {
  const text = pages.map((row) => row.text).join("\n");
  const chunks = text.split(/(?:^|\n)\s*(?:Q(?:uestion)?\s*)?(\d{1,3})[\).:\-]\s+/i);
  const questions: ExtractedQuestion[] = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const body = chunks[i + 1] || "";
    const parsed = parseQuestionBlock(body, questions.length, pages, sourcePdf);
    if (parsed) questions.push(parsed);
  }
  return questions.slice(0, 200);
}

function lineFromItems(items: Array<{ str: string; x: number; y: number }>) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let line = "";
  let lastX = -Infinity;
  for (const item of sorted) {
    const gap = item.x - lastX;
    if (line && gap > 1.6) line += " ";
    line += item.str;
    lastX = item.x + item.str.length * 4;
  }
  return line;
}

async function extractPdfPages(bytes: Uint8Array): Promise<{ page: number; text: string }[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "data:text/javascript,";
  const doc = await pdfjs.getDocument({
    data: bytes,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
  } as { data: Uint8Array }).promise;

  const pages: { page: number; text: string }[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ str: string; x: number; y: number }>>();
    for (const item of content.items) {
      if (!item || typeof item !== "object" || !("str" in item)) continue;
      const rec = item as { str: string; transform?: number[] };
      const x = rec.transform?.[4] ?? 0;
      const y = Math.round((rec.transform?.[5] ?? 0) / 3) * 3;
      const list = rows.get(y) || [];
      list.push({ str: rec.str, x, y });
      rows.set(y, list);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => lineFromItems(items))
      .filter(Boolean);
    pages.push({ page: pageNumber, text: lines.join("\n") });
  }
  return pages;
}

export async function ingestPdf(bytes: Uint8Array, sourcePdf: string | null): Promise<IngestResult> {
  try {
    const pages = await extractPdfPages(bytes);
    const text = pages.map((row) => row.text).join("\n");
    const kind = detectPdfKind(text);
    if (kind === "notes") {
      return { kind: "notes", questions: [], summary: "Detected notes or a book. Saved as a PDF reader item." };
    }
    const questions = parsePdfQuestions(pages, sourcePdf);
    if (!questions.length) {
      return { kind: "notes", questions: [], summary: "No clear questions found. Saved as a PDF book / notes." };
    }
    return {
      kind: "questions",
      questions,
      summary: `Detected a question paper. Extracted ${questions.length} question${questions.length === 1 ? "" : "s"} with page diagrams.`,
    };
  } catch {
    return { kind: "notes", questions: [], summary: "Could not read this PDF as questions. Saved as a book / notes." };
  }
}

function headerKey(value: string) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function pickCol(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseSheetRows(rows: string[][], sourcePdf: string | null): ExtractedQuestion[] {
  if (!rows.length) return [];
  const first = rows[0].map(headerKey);
  const looksHeader = first.some((cell) =>
    ["question", "stem", "q", "option_a", "a", "correct", "answer", "explanation", "solution"].includes(cell),
  );
  const headers = looksHeader ? first : [];
  const data = looksHeader ? rows.slice(1) : rows;
  const qi = pickCol(headers, ["question", "stem", "q", "prompt", "text"]);
  const ai = pickCol(headers, ["a", "option_a", "option1", "1"]);
  const bi = pickCol(headers, ["b", "option_b", "option2", "2"]);
  const ci = pickCol(headers, ["c", "option_c", "option3", "3"]);
  const di = pickCol(headers, ["d", "option_d", "option4", "4"]);
  const correcti = pickCol(headers, ["correct", "answer", "correct_option", "correctoption", "key"]);
  const expi = pickCol(headers, ["explanation", "solution", "explain"]);

  const questions: ExtractedQuestion[] = [];
  data.forEach((row, index) => {
    const cells = row.map((cell) => String(cell ?? "").trim());
    if (!cells.some(Boolean)) return;
    const stem = cells[qi >= 0 ? qi : 0] || "";
    if (!stem) return;
    const options = emptyOptions();
    options[0].text = cells[ai >= 0 ? ai : 1] || "";
    options[1].text = cells[bi >= 0 ? bi : 2] || "";
    options[2].text = cells[ci >= 0 ? ci : 3] || "";
    options[3].text = cells[di >= 0 ? di : 4] || "";
    questions.push({
      id: `q_${index + 1}`,
      stem,
      options,
      correctOption: asLetter(cells[correcti >= 0 ? correcti : 5]),
      explanation: cells[expi >= 0 ? expi : 6] || "",
      page: 1,
      source_pdf: sourcePdf,
    });
  });
  return questions.slice(0, 400);
}

export async function ingestExcel(bytes: Uint8Array, fileName: string): Promise<IngestResult> {
  try {
    const XLSX = await import("xlsx");
    const name = fileName.toLowerCase();
    const workbook = name.endsWith(".csv")
      ? XLSX.read(new TextDecoder().decode(bytes), { type: "string" })
      : XLSX.read(bytes, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]).map((row) =>
      row.map((cell) => String(cell ?? "")),
    );
    const questions = parseSheetRows(rows, null);
    if (!questions.length) {
      return { kind: "questions", questions: [], summary: "Excel saved, but no question rows were found. Check columns: question, A–D, correct, explanation." };
    }
    return {
      kind: "questions",
      questions,
      summary: `Converted Excel into ${questions.length} question${questions.length === 1 ? "" : "s"}.`,
    };
  } catch {
    return { kind: "questions", questions: [], summary: "Could not parse this Excel file. The file is still saved." };
  }
}

export async function ingestUpload(opts: {
  kind: "pdf" | "excel" | string;
  bytes: Uint8Array;
  fileName: string;
  sourcePdf: string | null;
}): Promise<IngestResult | null> {
  if (opts.kind === "pdf") return ingestPdf(opts.bytes, opts.sourcePdf);
  if (opts.kind === "excel") return ingestExcel(opts.bytes, opts.fileName);
  return null;
}
