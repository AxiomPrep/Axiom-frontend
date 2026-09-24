"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export type AttemptPayload = {
  attempt: { id: string; test_id?: string; server_deadline?: string };
  questions: { id: string; stem: string; options?: string[] | null; type?: string; difficulty?: string }[];
  duration_sec?: number;
  title?: string;
};

const KEY = (id: string) => `axiom-attempt-${id}`;

export function saveAttempt(payload: AttemptPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY(payload.attempt.id), JSON.stringify(payload));
}

export function readAttempt(id: string): AttemptPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttemptPayload;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function mapAttemptPayload(raw: unknown, title?: string): AttemptPayload | null {
  const root = asRecord(raw);
  if (!root) return null;
  const attempt = asRecord(root.attempt) || root;
  const id = String(attempt.id || root.id || "");
  if (!id) return null;
  const questionsRaw = Array.isArray(root.questions)
    ? root.questions
    : Array.isArray(attempt.questions)
      ? attempt.questions
      : [];
  const questions = questionsRaw.map((item, index) => {
    const rec = asRecord(item) || {};
    const options = Array.isArray(rec.options)
      ? rec.options.map((opt) => (typeof opt === "string" ? opt : String(asRecord(opt)?.text || asRecord(opt)?.label || "")))
      : undefined;
    return {
      id: String(rec.id || rec.question_id || index + 1),
      stem: String(rec.stem || rec.question || rec.prompt || rec.text || ""),
      options,
      type: rec.type ? String(rec.type) : undefined,
      difficulty: rec.difficulty ? String(rec.difficulty) : undefined,
    };
  });
  return {
    attempt: {
      id,
      test_id: attempt.test_id ? String(attempt.test_id) : undefined,
      server_deadline: attempt.server_deadline ? String(attempt.server_deadline) : undefined,
    },
    questions,
    duration_sec: Number(root.duration_sec ?? attempt.duration_sec) || undefined,
    title: title || (typeof root.title === "string" ? root.title : typeof attempt.title === "string" ? attempt.title : undefined),
  };
}

export async function loadAttempt(id: string): Promise<AttemptPayload | null> {
  const cached = readAttempt(id);
  try {
    const data = await api<unknown>(`/api/attempts/${id}`);
    const mapped = mapAttemptPayload(data, cached?.title);
    if (mapped?.questions.length) {
      saveAttempt(mapped);
      return mapped;
    }
  } catch {
    /* use the session started from Originals if the GET shape is missing */
  }
  return cached;
}

export function useStartTest() {
  const router = useRouter();

  async function startNamed(testId: string, title?: string) {
    const data = await api<AttemptPayload>(`/api/tests/${testId}/start`, {
      method: "POST",
      body: "{}",
    });
    saveAttempt({ ...data, title });
    router.push(`/attempts/${data.attempt.id}`);
    return data;
  }

  return { startNamed };
}
