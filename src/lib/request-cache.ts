const memory = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

function ttlFor(path: string) {
  const clean = path.split("?")[0];
  if (clean.startsWith("/catalog/") || clean.startsWith("/api/practice/") || clean.startsWith("/api/pyq/")) return 60_000;
  if (clean === "/api/me" || clean === "/api/student/dashboard" || clean === "/api/mentorship") return 20_000;
  if (clean === "/api/plans" || clean === "/api/timer") return 12_000;
  return 8_000;
}

export function cacheKey(path: string, method = "GET") {
  return `${method.toUpperCase()}:${path}`;
}

export function getCached<T>(path: string): T | undefined {
  const row = memory.get(cacheKey(path));
  if (!row) return undefined;
  if (Date.now() - row.at > ttlFor(path)) {
    memory.delete(cacheKey(path));
    return undefined;
  }
  return row.data as T;
}

export function setCached<T>(path: string, data: T) {
  memory.set(cacheKey(path), { at: Date.now(), data });
}

export function invalidateCache(match?: string) {
  if (!match) {
    memory.clear();
    return;
  }
  for (const key of memory.keys()) {
    if (key.includes(match)) memory.delete(key);
  }
}

export function singleflight<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const key = cacheKey(path);
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const pending = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

export function shouldCacheRequest(path: string, method: string) {
  if (method.toUpperCase() !== "GET") return false;
  const clean = path.split("?")[0];
  if (clean.startsWith("/api/auth/")) return false;
  return clean.startsWith("/api/") || clean.startsWith("/catalog/");
}
