"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { formatCountdown, readAccountAccess, type AccountAccess } from "@/lib/entitlement";
import { getPlans, type Plan } from "@/lib/study-api";
import { PageHeader, Shell } from "@/components/ui";

export default function SubscriptionPage() {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPlans()
      .then((next) => {
        if (!cancelled) setPlans(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setPlanError(err instanceof Error ? err.message : "Could not load plans.");
      });
    const token = Boolean(getAccessToken());
    setSignedIn(token);
    if (!token) return;
    void Promise.allSettled([api<unknown>("/api/me"), api<unknown>("/api/student/dashboard")]).then(
      ([me, dashboard]) => {
        if (cancelled) return;
        setAccess(
          readAccountAccess(
            me.status === "fulfilled" ? me.value : null,
            dashboard.status === "fulfilled" ? dashboard.value : null,
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!access?.trial) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [access]);

  return (
    <Shell>
      <PageHeader
        eyebrow="Subscription"
        title="Your platform access."
        subtitle="This page shows trial and account access. Paid pricing is only on IIT JEE mentorship."
      />

      <section className="surface rounded-2xl p-6 sm:p-8">
        <p className="font-display text-lg italic text-axiom">Current access</p>
        {!signedIn ? (
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">Sign in to load your trial and access details.</p>
            <Link href="/login" className="btn-primary h-10 px-4 text-sm">
              Login
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Status"
              value={access?.subscribed ? "Active" : access?.trial ? "Trial active" : access?.status || "—"}
            />
            <Detail label="Plan" value={access?.planName || "—"} />
            <Detail label="Started" value={access?.startedAt || "—"} />
            <Detail label="Ends" value={access?.endsAt || "—"} />
            {access?.trial ? (
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Trial countdown</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                  {formatCountdown(access.trial.endsAt - now)}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="surface mt-6 rounded-2xl p-6 sm:p-8">
        <p className="font-display text-lg italic text-axiom">IIT JEE mentorship</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Gold and Diamond pricing</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Mentorship is a separate IIT JEE programme. Compare Gold and Diamond, then enroll there.
        </p>
        {planError ? <p className="mt-3 text-sm text-red-300">{planError}</p> : null}
        {plans.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-axiom">{plan.type || "Plan"}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{plan.tagline}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{plan.priceLabel}</p>
              </article>
            ))}
          </div>
        ) : null}
        <Link href="/mentorship" className="btn-primary mt-6 inline-flex h-11 items-center px-5 text-sm">
          Open mentorship
        </Link>
      </section>
    </Shell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
