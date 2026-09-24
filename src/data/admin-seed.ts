/**
 * Admin access is granted only by this list (plus optional ADMIN_SEED_EMAILS).
 * Student signup / login cannot create an admin session.
 */
export const SEEDED_ADMINS = [
  { email: "admin@axiomprep.com", name: "Axiom Prep Admin" },
] as const;

export type SeededAdmin = (typeof SEEDED_ADMINS)[number];

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function seededAdminEmails() {
  const extra = (process.env.ADMIN_SEED_EMAILS || "")
    .split(",")
    .map(normalizeAdminEmail)
    .filter(Boolean);
  return [...SEEDED_ADMINS.map((row) => normalizeAdminEmail(row.email)), ...extra];
}

export function findSeededAdmin(email: string) {
  const normalized = normalizeAdminEmail(email);
  const named = SEEDED_ADMINS.find((row) => normalizeAdminEmail(row.email) === normalized);
  if (named) return { email: normalized, name: named.name };
  if (seededAdminEmails().includes(normalized)) {
    return { email: normalized, name: normalized.split("@")[0] || "Admin" };
  }
  return null;
}
