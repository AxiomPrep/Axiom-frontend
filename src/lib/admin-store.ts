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

export function contentHideKey(item: {
  title?: string | null;
  destination_id?: string | null;
  file_name?: string | null;
}) {
  const title = (item.title || "").trim().toLowerCase().replace(/\s+/g, " ");
  const dest = (item.destination_id || "").trim().toLowerCase();
  const file = (item.file_name || "").trim().toLowerCase();
  return `${dest}|${title}|${file}`;
}

type HiddenList = { ids: string[]; keys: string[] };

async function readHidden(): Promise<HiddenList> {
  try {
    const raw = await readFile(path.join(path.dirname(filePath), "admin-hidden.json"), "utf8");
    const parsed = JSON.parse(raw) as { ids?: string[]; keys?: string[] };
    return { ids: Array.isArray(parsed.ids) ? parsed.ids : [], keys: Array.isArray(parsed.keys) ? parsed.keys : [] };
  } catch {
    return { ids: [], keys: [] };
  }
}

async function writeHidden(hidden: HiddenList) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(path.join(path.dirname(filePath), "admin-hidden.json"), JSON.stringify(hidden), "utf8");
}

export async function listHiddenAdminIds() {
  return (await readHidden()).ids;
}

export async function listHiddenAdminKeys() {
  return (await readHidden()).keys;
}

export function isHiddenContent(
  item: AdminContent,
  hiddenIds: string[],
  hiddenKeys: string[],
) {
  if (hiddenIds.includes(item.id) || (item.live_id && hiddenIds.includes(item.live_id))) return true;
  const key = contentHideKey(item);
  if (hiddenKeys.includes(key)) return true;
  const dest = (item.destination_id || "").trim().toLowerCase();
  const title = (item.title || "").trim().toLowerCase().replace(/\s+/g, " ");
  const file = (item.file_name || "").trim().toLowerCase();
  const exact = `${dest}|${title}|${file}`;
  return hiddenKeys.includes(exact);
}

export async function removeStoredAdminContent(
  id: string,
  match?: { title?: string | null; destination_id?: string | null; file_name?: string | null },
) {
  const current = await readAll();
  const target = current.find((item) => item.id === id || item.live_id === id);
  const key = contentHideKey(match || target || { title: "", destination_id: "", file_name: "" });
  const next = current.filter((item) => {
    if (item.id === id || item.live_id === id) return false;
    if (target && (item.id === target.id || item.live_id === target.id || item.live_id === target.live_id)) return false;
    if (key.endsWith("||")) return true;
    return contentHideKey(item) !== key;
  });
  await writeAll(next);

  const hidden = await readHidden();
  const ids = new Set(hidden.ids);
  ids.add(id);
  if (target?.id) ids.add(target.id);
  if (target?.live_id) ids.add(target.live_id);
  const keys = new Set(hidden.keys);
  const title = (match?.title || target?.title || "").trim().toLowerCase().replace(/\s+/g, " ");
  const dest = (match?.destination_id || target?.destination_id || "").trim().toLowerCase();
  if (key && !key.endsWith("||")) keys.add(key);
  await writeHidden({ ids: [...ids], keys: [...keys] });
  return { ok: true };
}
