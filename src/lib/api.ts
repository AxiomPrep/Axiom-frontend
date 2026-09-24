import { getAccessToken } from "@/lib/session";

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isPublicApiPath(path: string) {
  const clean = path.split("?")[0];
  return (
    clean === "/api/plans" ||
    clean.startsWith("/api/auth/") ||
    clean === "/api/signup" ||
    clean === "/api/signin" ||
    clean === "/api/login" ||
    clean === "/api/register" ||
    clean === "/api/teachers" ||
    clean.startsWith("/api/teachers/") ||
    clean === "/api/contents" ||
    clean.startsWith("/api/contents/")
  );
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!token && path.startsWith("/api/") && !isPublicApiPath(path)) {
    throw new ApiClientError(401, "unauthorized", "Authentication required");
  }

  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string | Record<string, unknown>;
  };

  if (!res.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : data.message
          ? JSON.stringify(data.message)
          : data.error || `Request failed (${res.status})`;
    throw new ApiClientError(res.status, data.error || "error", message);
  }

  return data as T;
}

export function isUnauthorized(err: unknown) {
  return err instanceof ApiClientError && (err.status === 401 || err.code === "unauthorized");
}

export type Teacher = {
  id: string;
  bio: string | null;
  subjects: string[];
  badge: string | null;
  is_featured: boolean;
  image_url: string | null;
  years_experience: number | null;
  selections_count: number | null;
  subject_focus: string | null;
  full_name?: string | null;
  email?: string | null;
  profiles?:
    | { full_name?: string | null; avatar_url?: string | null; email?: string | null }
    | { full_name?: string | null; avatar_url?: string | null; email?: string | null }[]
    | null;
};

export type PopularContent = {
  id: string;
  title: string;
  type: string;
  module: string | null;
  chapter_id: string | null;
  class_level: string | null;
  duration_sec: number | null;
  chapters?: { title?: string } | null;
};

export type ChapterSummary = {
  chapter_id: string;
  title: string;
  videos: number;
  pdfs: number;
};

export type ContentItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  module: string | null;
  timeline: unknown;
  duration_sec: number | null;
  storage_path: string | null;
  external_url: string | null;
  resource_storage_path?: string | null;
  sort_order: number;
  is_free_preview: boolean;
};

export type TimelineCue = {
  label?: string;
  title?: string;
  time?: number;
  time_sec?: number;
  seconds?: number;
  t?: number;
};

export function teacherName(t: Teacher) {
  const nested = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
  return t.full_name || nested?.full_name || t.email || "Teacher";
}

export function teacherInitial(t: Teacher) {
  return teacherName(t).trim().charAt(0).toUpperCase() || "T";
}

export function teacherSubject(t: Teacher) {
  return (t.subject_focus || t.subjects?.[0] || "General").toUpperCase();
}

export function isBioSubject(t: Teacher) {
  const s = teacherSubject(t).toLowerCase();
  return s.includes("bio");
}

export function formatSelections(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString()}+`;
}

export function formatDuration(sec: number | null | undefined) {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} Hour${h === 1 ? "" : "s"}`;
  return `${m} min`;
}

export function parseTimeline(raw: unknown): { label: string; seconds: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (typeof item === "string") return { label: item, seconds: 0 };
      if (!item || typeof item !== "object") return { label: `Part ${i + 1}`, seconds: 0 };
      const cue = item as TimelineCue;
      const seconds = Number(cue.time_sec ?? cue.seconds ?? cue.time ?? cue.t ?? 0) || 0;
      const label = String(cue.label || cue.title || `Part ${i + 1}`);
      return { label, seconds };
    })
    .filter((x) => x.label);
}
