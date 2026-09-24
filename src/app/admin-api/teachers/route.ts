import { NextResponse } from "next/server";
import { findSeededAdmin } from "@/data/admin-seed";
import { SEEDED_TEACHERS, type AdminTeacher } from "@/data/admin-teachers";
import { listStoredAdminContents } from "@/lib/admin-store";

function readAdminEmail(req: Request) {
  const header = req.headers.get("x-admin-email") || "";
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)axiom_admin_email=([^;]+)/)?.[1] || "";
  return decodeURIComponent(header || cookie);
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "teacher";
}

export async function GET(req: Request) {
  const admin = findSeededAdmin(readAdminEmail(req));
  if (!admin) {
    return NextResponse.json({ error: "forbidden", message: "Admin seed access required." }, { status: 403 });
  }

  const byId = new Map<string, AdminTeacher>();
  for (const teacher of SEEDED_TEACHERS) byId.set(teacher.id, teacher);

  const stored = await listStoredAdminContents();
  for (const item of stored) {
    const name = item.teacher?.trim();
    if (!name) continue;
    const id = slug(name);
    if (!byId.has(id)) {
      byId.set(id, { id, name, subject: item.subject || "physics" });
    }
  }

  const origin = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";
  try {
    const live = await fetch(`${origin}/api/admin/teachers`, {
      headers: { "x-admin-email": admin.email },
      signal: AbortSignal.timeout(2500),
    });
    const payload = (await live.json().catch(() => ({}))) as { teachers?: Array<Record<string, unknown>> };
    for (const row of payload.teachers ?? []) {
      const name = String(row.full_name || row.name || "").trim();
      if (!name) continue;
      const subject = String(
        (Array.isArray(row.subjects) ? row.subjects[0] : row.subject_focus || row.subject) || "physics",
      )
        .toLowerCase()
        .replace(/\s+/g, "");
      const id = String(row.id || slug(name));
      byId.set(id, {
        id,
        name,
        subject: ["physics", "chemistry", "mathematics", "biology"].includes(subject) ? subject : "physics",
      });
    }
  } catch {
    /* seed + stored teachers are enough until the live admin teachers route exists */
  }

  return NextResponse.json({ teachers: [...byId.values()] });
}
