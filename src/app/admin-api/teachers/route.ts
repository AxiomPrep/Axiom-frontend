import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import { SEEDED_TEACHERS, mergeFacultyLists, type AdminTeacher } from "@/data/admin-teachers";
import { mapLiveContent } from "@/lib/admin";
import { teachersFromUploads } from "@/lib/faculty-catalog";

const API_ORIGIN = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";
const SUBJECTS = new Set(["physics", "chemistry", "mathematics", "biology"]);

function readAdminEmail(req: Request) {
  const header = req.headers.get("x-admin-email") || "";
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)axiom_admin_email=([^;]+)/)?.[1] || "";
  return decodeURIComponent(header || cookie);
}

function requireAdmin(req: Request) {
  const admin = findSeededAdmin(readAdminEmail(req));
  if (!admin) {
    return {
      admin: null,
      error: NextResponse.json({ error: "forbidden", message: "Admin seed access required." }, { status: 403 }),
    };
  }
  return { admin, error: null };
}

function slug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "teacher"
  );
}

function subjectOf(value: unknown) {
  const raw = String(value || "physics")
    .toLowerCase()
    .replace(/\s+/g, "");
  return SUBJECTS.has(raw) ? raw : "physics";
}

function fromLiveRow(row: Record<string, unknown>): AdminTeacher | null {
  const name = String(row.full_name || row.name || "").trim();
  if (!name) return null;
  const subject = subjectOf(Array.isArray(row.subjects) ? row.subjects[0] : row.subject_focus || row.subject);
  return {
    id: String(row.slug || row.id || slug(name)),
    name,
    subject,
    listed: true,
  };
}

async function fetchLiveJson<T>(path: string, email: string, init?: RequestInit): Promise<T | null> {
  try {
    const headers = new Headers(init?.headers);
    headers.set("x-admin-email", email);
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const res = await fetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(init?.method && init.method !== "GET" ? 8000 : 15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function liveTeachers(email: string): Promise<AdminTeacher[]> {
  const [adminList, publicList, contents] = await Promise.all([
    fetchLiveJson<{ teachers?: Array<Record<string, unknown>> }>("/api/admin/teachers", email),
    fetchLiveJson<{ teachers?: Array<Record<string, unknown>> }>("/api/teachers", email),
    fetchLiveJson<{ contents?: Array<Record<string, unknown>> }>("/api/admin/contents", email),
  ]);
  const fromApi = [...(adminList?.teachers || []), ...(publicList?.teachers || [])]
    .map(fromLiveRow)
    .filter((row): row is AdminTeacher => Boolean(row));
  const fromContents = teachersFromUploads((contents?.contents || []).map((row) => mapLiveContent(row, email)));
  return mergeFacultyLists([], [...fromApi, ...fromContents]);
}

export async function GET(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (!admin) return error;

  const live = await liveTeachers(admin.email);
  return NextResponse.json({ teachers: mergeFacultyLists(SEEDED_TEACHERS, live) });
}

export async function POST(req: Request) {
  const { admin, error } = requireAdmin(req);
  if (!admin) return error;

  const body = (await req.json().catch(() => ({}))) as { name?: string; subject?: string };
  const name = String(body.name || "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "validation_error", message: "Teacher name is required." }, { status: 400 });
  }
  const subject = subjectOf(body.subject);

  const created = await fetchLiveJson<{ teacher?: Record<string, unknown> }>("/api/admin/teachers", admin.email, {
    method: "POST",
    body: JSON.stringify({ name, subject }),
  });
  const teacher =
    fromLiveRow(created?.teacher || {}) ||
    ({ id: slug(name), name, subject, listed: true } satisfies AdminTeacher);

  return NextResponse.json({ teacher }, { status: 201 });
}
