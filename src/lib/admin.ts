import type { AdminSourceKind } from "@/lib/admin-destinations";

export type AdminSession = {
  email: string;
  name: string;
};

export type AdminContent = {
  id: string;
  title: string;
  type: "video" | "note_pdf" | "original";
  description: string | null;
  external_url: string | null;
  storage_path: string | null;
  class_level: string | null;
  subject: string | null;
  module: string | null;
  is_published: boolean;
  is_free_preview: boolean;
  created_at: string;
  created_by: string;
  live_id?: string | null;
  live_error?: string | null;
  destination_id?: string | null;
  destination_title?: string | null;
  destination_href?: string | null;
  slot_id?: string | null;
  slot_label?: string | null;
  source_kind?: AdminSourceKind | null;
  file_name?: string | null;
  teacher?: string | null;
  chapter?: string | null;
  exam?: string | null;
  year?: string | null;
  tier?: string | null;
  tool_kind?: string | null;
  quiz_tier?: string | null;
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, credentials: "include", headers });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : `Request failed (${res.status})`);
  }
  return data as T;
}

export function requestAdminAccess(email: string) {
  return adminFetch<AdminSession>("/admin-api/access", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function readAdminSession() {
  return adminFetch<AdminSession | { email: null }>("/admin-api/access");
}

export function clearAdminSession() {
  return adminFetch<{ ok: true }>("/admin-api/access", { method: "DELETE" });
}

export function listAdminContents() {
  return adminFetch<{ contents: AdminContent[] }>("/admin-api/contents");
}

export function listAdminTeachers() {
  return adminFetch<{ teachers: { id: string; name: string; subject: string }[] }>("/admin-api/teachers");
}

export function createAdminContent(body: FormData | Record<string, unknown>) {
  if (body instanceof FormData) {
    return adminFetch<{ content: AdminContent }>("/admin-api/contents", {
      method: "POST",
      body,
    });
  }
  return adminFetch<{ content: AdminContent }>("/admin-api/contents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
