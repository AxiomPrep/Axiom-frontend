import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { AdminContent } from "@/lib/admin";

const filePath = path.join(process.cwd(), ".data", "admin-uploads.json");
const filesDir = path.join(process.cwd(), ".data", "files");

export function adminFilesDir() {
  return filesDir;
}

export async function saveAdminFile(id: string, originalName: string, bytes: Uint8Array) {
  const ext = path.extname(originalName).replace(/[^\w.]/g, "").slice(0, 8) || "";
  const safe = `${id}${ext || ""}`;
  await mkdir(filesDir, { recursive: true });
  await writeFile(path.join(filesDir, safe), bytes);
  return { storedName: safe, publicPath: `/admin-api/files/${encodeURIComponent(safe)}` };
}

async function readAll(): Promise<AdminContent[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { contents?: AdminContent[] };
    return Array.isArray(parsed.contents) ? parsed.contents : [];
  } catch {
    return [];
  }
}

async function writeAll(contents: AdminContent[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ contents }, null, 2), "utf8");
}

export async function listStoredAdminContents() {
  return readAll();
}

export async function findStoredAdminContent(id: string) {
  const contents = await readAll();
  return contents.find((item) => item.id === id || item.live_id === id) || null;
}

export async function saveAdminContent(content: AdminContent) {
  const contents = await readAll();
  contents.unshift(content);
  await writeAll(contents);
  return content;
}
