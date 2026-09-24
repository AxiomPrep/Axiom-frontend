function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstRecord(...values: unknown[]) {
  for (const value of values) {
    const record = asRecord(value);
    if (record) return record;
  }
  return null;
}

function firstString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function firstNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function firstDate(record: Record<string, unknown> | null, keys: string[]) {
  const raw = firstString(record, keys);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPaid(value: string) {
  const text = value.toLowerCase();
  if (!text) return false;
  if (text.includes("trial")) return false;
  return /active|paid|pro|premium|subscribed|one_time|subscription|batch/.test(text);
}

export type TrialState = {
  endsAt: number;
};

export type AccountAccess = {
  subscribed: boolean;
  trial: TrialState | null;
  planName: string;
  planType: string;
  status: string;
  mentorship: string;
  startedAt: string;
  endsAt: string;
  email: string;
};

function collectRecords(...payloads: unknown[]) {
  return payloads.flatMap((payload) => {
    const root = asRecord(payload);
    if (!root) return [];
    return [
      root,
      asRecord(root.user),
      asRecord(root.profile),
      asRecord(root.me),
      asRecord(root.account),
      asRecord(root.entitlement),
      asRecord(root.subscription),
      asRecord(root.plan),
      asRecord(asRecord(root.user)?.entitlement),
      asRecord(asRecord(root.user)?.subscription),
    ].filter(Boolean) as Record<string, unknown>[];
  });
}

export function readAccountAccess(...payloads: unknown[]): AccountAccess {
  const merged = collectRecords(...payloads).reduce<Record<string, unknown>>((acc, item) => ({ ...acc, ...item }), {});
  const bag = firstRecord(merged);
  const planName = firstString(bag, ["plan_name", "plan", "name", "plan_slug"]);
  const planType = firstString(bag, ["plan_type", "type", "billing_type"]);
  const status = firstString(bag, ["subscription_status", "status", "access_status", "entitlement_status"]);
  const subscribedFlag =
    bag?.is_subscribed === true ||
    bag?.subscribed === true ||
    bag?.has_subscription === true ||
    bag?.includes_platform === true;
  const subscribed = Boolean(subscribedFlag || isPaid(planName) || isPaid(status) || isPaid(planType));
  const started = firstDate(bag, ["started_at", "starts_at", "created_at", "trial_started_at"]);
  const ends = firstDate(bag, [
    "ends_at",
    "expires_at",
    "access_ends_at",
    "trial_ends_at",
    "trial_end",
    "trial_expires_at",
  ]);
  return {
    subscribed,
    trial: readTrialState(...payloads),
    planName: planName || (subscribed ? "Axiom Prep plan" : "No paid plan"),
    planType: planType || (subscribed ? "Paid" : "Trial"),
    status: status || (subscribed ? "Active" : "Trial"),
    mentorship: firstString(bag, ["mentorship_tier", "mentorship", "mentor_tier"]) || "None",
    startedAt: started ? started.toLocaleDateString() : "—",
    endsAt: ends ? ends.toLocaleDateString() : "—",
    email: firstString(bag, ["email"]),
  };
}

export function readTrialState(...payloads: unknown[]): TrialState | null {
  const records = payloads.flatMap((payload) => {
    const root = asRecord(payload);
    if (!root) return [];
    return [
      root,
      asRecord(root.user),
      asRecord(root.profile),
      asRecord(root.me),
      asRecord(root.account),
      asRecord(root.entitlement),
      asRecord(root.subscription),
      asRecord(root.plan),
      asRecord(asRecord(root.user)?.entitlement),
      asRecord(asRecord(root.user)?.subscription),
    ].filter(Boolean) as Record<string, unknown>[];
  });

  const merged = records.reduce<Record<string, unknown>>((acc, item) => ({ ...acc, ...item }), {});
  const bag = firstRecord(merged);

  const subscribedFlag =
    bag?.is_subscribed === true ||
    bag?.subscribed === true ||
    bag?.has_subscription === true ||
    bag?.includes_platform === true;
  const plan = firstString(bag, ["plan", "plan_type", "plan_slug", "slug", "name"]);
  const status = firstString(bag, ["subscription_status", "status", "access_status", "entitlement_status"]);
  const subscribed = Boolean(subscribedFlag || isPaid(plan) || isPaid(status));
  if (subscribed) return null;

  const endsAt = firstDate(bag, [
    "trial_ends_at",
    "trial_end",
    "trial_expires_at",
    "trial_end_date",
    "trial_expiry",
    "access_ends_at",
    "expires_at",
  ]);
  const daysLeft = firstNumber(bag, ["trial_days_left", "trialDaysLeft", "days_left", "trial_days"]);
  const secondsLeft = firstNumber(bag, ["trial_seconds_left", "seconds_left"]);

  let remainingMs = 0;
  if (endsAt) remainingMs = endsAt.getTime() - Date.now();
  else if (secondsLeft != null && secondsLeft > 0) remainingMs = secondsLeft * 1000;
  else if (daysLeft != null && daysLeft > 0) remainingMs = daysLeft * 24 * 60 * 60 * 1000;

  const inTrial =
    bag?.is_trial === true ||
    bag?.trial_active === true ||
    /trial/.test(`${plan} ${status}`) ||
    remainingMs > 0;

  if (!inTrial || remainingMs <= 0) return null;
  return { endsAt: Date.now() + remainingMs };
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
