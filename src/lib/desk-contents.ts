import { mapLiveContent, type AdminContent } from "@/lib/admin";
import { isHiddenContent, listHiddenAdminIds, listHiddenAdminKeys } from "@/lib/admin-store";

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
  const [live, hiddenIds, hiddenKeys] = await Promise.all([
    listLiveDeskContents(),
    listHiddenAdminIds().catch(() => []),
    listHiddenAdminKeys().catch(() => []),
  ]);
  return live.filter((item) => {
    if (isHiddenContent(item, hiddenIds, hiddenKeys)) return false;
    if (item.title === "Lec 1: Introduction" || (item.description || "").includes("Sample lecture")) return false;
    return true;
  });
}

export async function findDeskContent(id: string) {
  const contents = await listDeskContents();
  return contents.find((item) => item.id === id || item.live_id === id) || null;
}
