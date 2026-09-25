import { mapLiveContent, type AdminContent } from "@/lib/admin";
import { listStoredAdminContents } from "@/lib/admin-store";

const API_ORIGIN = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

function seedAdminEmail() {
  return (process.env.ADMIN_SEED_EMAILS || "admin@axiomprep.com").split(",")[0].trim().toLowerCase();
}

async function listLiveDeskContents(): Promise<AdminContent[]> {
  const email = seedAdminEmail();
  try {
    const res = await fetch(`${API_ORIGIN}/api/admin/contents`, {
      headers: { "x-admin-email": email },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const payload = (await res.json()) as { contents?: Record<string, unknown>[] };
    return (payload.contents || []).map((row) => mapLiveContent(row, email));
  } catch {
    return [];
  }
}

export async function listDeskContents() {
  const [live, local] = await Promise.all([listLiveDeskContents(), listStoredAdminContents().catch(() => [])]);
  const byId = new Map<string, AdminContent>();
  for (const item of local) byId.set(item.id, item);
  for (const item of live) byId.set(item.live_id || item.id, item);
  return [...byId.values()];
}

export async function findDeskContent(id: string) {
  const contents = await listDeskContents();
  return contents.find((item) => item.id === id || item.live_id === id) || null;
}
