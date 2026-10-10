import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { POLICY_VERSION } from "@/data/policies";

const filePath = path.join(process.cwd(), ".data", "policy-acceptances.json");

export type PolicyAcceptance = {
  id: string;
  acceptedAt: string;
  policyVersion: string;
  termsAccepted: boolean;
  refundAccepted: boolean;
  privacyAcknowledged: boolean;
  email: string;
  name: string;
  userId: string | null;
  planId: string | null;
  planName: string | null;
  track: string | null;
  userAgent: string | null;
  ip: string | null;
};

type Store = { acceptances: PolicyAcceptance[] };

async function readAll(): Promise<PolicyAcceptance[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return Array.isArray(parsed.acceptances) ? parsed.acceptances : [];
  } catch {
    return [];
  }
}

async function writeAll(acceptances: PolicyAcceptance[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ acceptances }, null, 2), "utf8");
}

export async function listPolicyAcceptances(filters?: { email?: string | null }) {
  const all = await readAll();
  const email = (filters?.email || "").trim().toLowerCase();
  if (!email) return all;
  return all.filter((row) => row.email.toLowerCase() === email);
}

export async function recordPolicyAcceptance(input: {
  email: string;
  name?: string | null;
  userId?: string | null;
  planId?: string | null;
  planName?: string | null;
  track?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  termsAccepted: boolean;
  refundAccepted: boolean;
  privacyAcknowledged?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required to record policy acceptance.");
  if (!input.termsAccepted || !input.refundAccepted) {
    throw new Error("Terms and Refund Policy must both be accepted.");
  }

  const row: PolicyAcceptance = {
    id: randomUUID(),
    acceptedAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
    termsAccepted: true,
    refundAccepted: true,
    privacyAcknowledged: Boolean(input.privacyAcknowledged),
    email,
    name: (input.name || "").trim() || email,
    userId: input.userId || null,
    planId: input.planId || null,
    planName: input.planName || null,
    track: input.track || null,
    userAgent: input.userAgent || null,
    ip: input.ip || null,
  };

  const acceptances = await readAll();
  acceptances.unshift(row);
  await writeAll(acceptances);
  return row;
}

export async function latestAcceptanceForEmail(email: string, policyVersion = POLICY_VERSION) {
  const rows = await listPolicyAcceptances({ email });
  return rows.find((row) => row.policyVersion === policyVersion && row.termsAccepted && row.refundAccepted) || null;
}
