"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { formatCountdown, readAccountAccess, type AccountAccess } from "@/lib/entitlement";
import { getPlans, payForPlan, type Plan } from "@/lib/study-api";
import { PageHeader, Shell } from "@/components/ui";

type Cell = true | string;

type MentorshipTier = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  was: string;
  save: string;
};

type CheckoutItem = {
  id: string;
  name: string;
  priceLabel: string;
  description: string;
};

const TIERS: MentorshipTier[] = [
  { id: "gold", name: "Gold", price: 399, priceLabel: "₹399", was: "₹799", save: "₹400" },
  { id: "diamond", name: "Diamond", price: 799, priceLabel: "₹799", was: "₹1,299", save: "₹500" },
];

const ROWS: { feature: string; gold: Cell; diamond: Cell }[] = [
  { feature: "WhatsApp group with mentors", gold: true, diamond: true },
  { feature: "Guidance-related doubt solving", gold: true, diamond: true },
  { feature: "Daily targets & updates", gold: true, diamond: true },
  { feature: "Group size", gold: "25–30", diamond: "25–30" },
  { feature: "Weekly group meet call", gold: "~45 min", diamond: "~45 min" },
  { feature: "Strategy, planning & consistency coaching", gold: true, diamond: true },
  { feature: "1-to-1 mentor calls (5 min each)", gold: "—", diamond: "2 calls" },
  { feature: "Exclusive question banks (per subject)", gold: "—", diamond: true },
  { feature: "Academic doubt solving by educators", gold: "—", diamond: true },
  { feature: "Live doubt sessions + recordings", gold: "—", diamond: true },
  { feature: "30-min crisp lectures on most-doubted concepts", gold: "—", diamond: true },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Join your mentor group",
    body: "Get added to a WhatsApp group with IIT, BITS and ISI mentors and 25–30 aspirants.",
  },
  {
    step: "02",
    title: "Share your targets every day",
    body: "Send daily targets and updates so mentors always know where you stand.",
  },
  {
    step: "03",
    title: "Meet every week",
    body: "A weekly group call of about 45 minutes for guidance, doubts, and strategy.",
  },
  {
    step: "04",
    title: "Stay on the right path",
    body: "Mentors spot mistakes early, correct your course, and keep you moving.",
  },
];

const GUIDE_ON = [
  { title: "Study strategy", body: "The right plan for the right subjects, built around your target." },
  { title: "Planning", body: "Clear weekly and daily plans so nothing is left to chance." },
  { title: "Time management", body: "Make every study hour count, without burning out." },
  { title: "Consistency", body: "Habits and routines that keep you going day after day." },
  { title: "Staying on track", body: "Regular check-ins so you never drift from your targets." },
  { title: "Right direction", body: "Mentors point out what is going wrong and correct your course." },
];

function isMentorshipPlan(plan: Plan) {
  const hay = `${plan.id} ${plan.name} ${plan.type} ${plan.mentorship}`.toLowerCase();
  return hay.includes("mentor") || hay.includes("gold") || hay.includes("diamond") || plan.mentorship === "a" || plan.mentorship === "b";
}

function matchTier(plan: Plan, tier: MentorshipTier) {
  const hay = `${plan.id} ${plan.name} ${plan.type} ${plan.mentorship}`.toLowerCase();
  if (hay.includes(tier.id)) return true;
  if (tier.id === "gold" && (plan.mentorship === "a" || hay.includes("mentorship a"))) return true;
  if (tier.id === "diamond" && (plan.mentorship === "b" || hay.includes("mentorship b"))) return true;
  return false;
}

export default function SubscriptionPage() {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planError, setPlanError] = useState<string | null>(null);
  const [currentMentorship, setCurrentMentorship] = useState<string | null>(null);
  const [selected, setSelected] = useState<CheckoutItem | null>(null);
  const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "success">("idle");
  const [payError, setPayError] = useState<string | null>(null);

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
    void Promise.allSettled([
      api<unknown>("/api/me"),
      api<unknown>("/api/student/dashboard"),
      api<Record<string, unknown>>("/api/mentorship"),
    ]).then(([me, dashboard, mentorship]) => {
      if (cancelled) return;
      setAccess(
        readAccountAccess(
          me.status === "fulfilled" ? me.value : null,
          dashboard.status === "fulfilled" ? dashboard.value : null,
        ),
      );
      if (mentorship.status === "fulfilled") {
        const data = mentorship.value;
        const active = data.active && typeof data.active === "object" ? (data.active as Record<string, unknown>) : null;
        const label =
          (typeof active?.mentor_label === "string" && active.mentor_label) ||
          (typeof active?.tier === "string" && active.tier) ||
          (typeof data.tier === "string" && data.tier) ||
          (typeof data.mentorship_tier === "string" && data.mentorship_tier) ||
          "";
        if (label && label !== "none") setCurrentMentorship(label);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!access?.trial) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [access]);

  const platformPlans = plans.filter((plan) => !isMentorshipPlan(plan));
  const displayTiers = TIERS.map((tier) => {
    const match = plans.find((plan) => matchTier(plan, tier));
    if (!match) return tier;
    return {
      ...tier,
      id: match.id,
      name: match.name || tier.name,
      price: match.price || tier.price,
      priceLabel: match.priceLabel || tier.priceLabel,
    };
  });

  const openCheckout = (item: CheckoutItem) => {
    setSelected(item);
    setCheckoutState("idle");
    setPayError(null);
  };

  const pay = async () => {
    if (!selected) return;
    if (!getAccessToken()) {
      window.location.assign(`/login?next=${encodeURIComponent("/subscription")}`);
      return;
    }
    setCheckoutState("processing");
    setPayError(null);
    try {
      await payForPlan(selected.id, {
        email: access?.email,
        description: selected.description,
      });
      setCheckoutState("success");
      if (selected.description.toLowerCase().includes("mentorship")) {
        setCurrentMentorship(selected.name);
      }
    } catch (err) {
      setCheckoutState("idle");
      setPayError(err instanceof Error ? err.message : "Payment did not complete.");
    }
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Subscription"
        title="Plans, payment, and IIT JEE mentorship."
        subtitle="See your access, pay for a platform plan, or enroll in Gold or Diamond mentorship from this page."
      />

      <section className="surface rounded-2xl p-6 sm:p-8">
        <p className="font-display text-lg italic text-axiom">Current access</p>
        {!signedIn ? (
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-400">Sign in to load your trial, payment, and mentorship details.</p>
            <Link href="/login?next=%2Fsubscription" className="btn-primary h-10 px-4 text-sm">
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
            <Detail label="Mentorship" value={currentMentorship || access?.mentorship || "None"} />
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
        <p className="font-display text-lg italic text-axiom">Platform plans</p>
        <p className="mt-2 text-sm text-zinc-400">Pay here for platform access. Mentorship is a separate IIT JEE programme below.</p>
        {planError ? <p className="mt-3 text-sm text-red-300">{planError}</p> : null}
        {platformPlans.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {platformPlans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-line bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-axiom">{plan.type || "Plan"}</p>
                <h3 className="mt-1 font-display text-xl font-semibold text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{plan.tagline}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{plan.priceLabel}</p>
                {plan.features.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-zinc-400">
                    {plan.features.slice(0, 6).map((feature) => (
                      <li key={feature}>· {feature}</li>
                    ))}
                  </ul>
                ) : null}
                {plan.price > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      openCheckout({
                        id: plan.id,
                        name: plan.name,
                        priceLabel: plan.priceLabel,
                        description: `Axiom Prep · ${plan.name}`,
                      })
                    }
                    className="btn-primary mt-5 h-11 w-full text-sm"
                  >
                    Pay {plan.priceLabel}
                  </button>
                ) : (
                  <p className="mt-5 text-sm text-axiom">Included with a new account.</p>
                )}
              </article>
            ))}
          </div>
        ) : !planError ? (
          <p className="mt-4 text-sm text-zinc-400">Plans load from the live catalog.</p>
        ) : null}
      </section>

      <p className="mb-2 mt-14 text-[13px] font-medium tracking-[0.18em] text-axiom">IIT JEE · Mentorship</p>
      <PageHeader
        title="Personal guidance from student mentors of IIT, BITS and ISI."
        subtitle="The Axiom Prep IIT JEE Mentorship puts you in a group of 25–30 aspirants with daily direction on strategy, planning, and consistency, so every day of preparation counts."
      />
      <p className="mb-8 text-sm text-muted">Axiom Prep IIT JEE Mentorship · Early bird · Limited seats</p>

      {currentMentorship ? (
        <p className="mb-6 text-sm text-axiom">
          Current mentorship · <span className="font-semibold text-ink">{currentMentorship}</span>
        </p>
      ) : null}

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Group size" value="25–30" detail="Aspirants per group, so every student gets attention" />
        <Stat label="Weekly" value="~45 min" detail="Group meet call with your mentors" />
        <Stat label="Daily" value="Targets" detail="Progress updates shared with mentors" />
      </div>

      <section className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">Your mentors come from</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["IIT", "BITS", "ISI"].map((place) => (
            <div key={place} className="rounded-2xl border border-line bg-card px-5 py-5">
              <p className="font-display text-2xl font-semibold text-ink">{place}</p>
              <p className="mt-1 text-sm text-zinc-400">Student mentors · Guidance and strategy</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-display text-lg italic text-axiom">
          Hard work needs the right direction. Your mentors are there to make sure you never lose it.
        </p>
      </section>

      <section className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">How it works</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Simple, structured, and every single day.</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="rounded-2xl border border-line bg-card px-5 py-5">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-axiom">{item.step}</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">What your mentors guide you on</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_ON.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-card px-5 py-5">
              <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">Plans and early bird pricing</p>
        <h2 className="mt-2 mb-5 font-display text-3xl font-semibold text-ink">Gold vs Diamond, side by side.</h2>
      </section>

      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-card">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-3 border-b border-line px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:px-7">
          <span>Feature</span>
          <span className="text-center text-axiom">Gold</span>
          <span className="text-center text-axiom">Diamond</span>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.feature}
            className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0 sm:px-7"
          >
            <p className="text-sm text-ink">{row.feature}</p>
            <Cell value={row.gold} />
            <Cell value={row.diamond} />
          </div>
        ))}
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-3 bg-axiom/10 px-5 py-5 sm:px-7">
          <p className="text-sm font-medium text-ink">Early bird price</p>
          {displayTiers.map((tier) => (
            <div key={tier.id} className="text-center">
              <p className="text-xs text-zinc-500 line-through">{tier.was}</p>
              <p className="font-display text-2xl font-semibold text-ink">{tier.priceLabel}</p>
              <p className="text-[11px] text-axiom">You save {tier.save}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-zinc-400">
        Diamond students get academic doubts solved by educators with an MSc and PhD, from IIT Bombay, ISI Kolkata, BITS
        Pilani, and NIT Trichy. Live sessions are recorded, and frequently asked concepts become crisp 30-minute lectures.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {displayTiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() =>
              openCheckout({
                id: tier.id,
                name: tier.name,
                priceLabel: tier.priceLabel,
                description: `IIT JEE mentorship · ${tier.name}`,
              })
            }
            className={`h-12 text-sm ${tier.name.toLowerCase().includes("diamond") ? "btn-primary" : "btn-ghost"}`}
          >
            Enroll in {tier.name} · {tier.priceLabel}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="surface w-full max-w-md rounded-2xl p-6">
            {checkoutState === "success" ? (
              <div className="text-center">
                <p className="font-display text-lg italic text-axiom">Paid</p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-ink">{selected.name}</h3>
                <p className="mt-2 text-sm text-muted">Your payment is confirmed. Access updates on this account.</p>
                <button type="button" onClick={() => setSelected(null)} className="btn-primary mt-6 h-11 px-6 text-sm">
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="font-display text-lg italic text-axiom">Payment</p>
                <h3 className="mt-1 font-display text-3xl font-semibold text-ink">{selected.name}</h3>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <dt>Item</dt>
                    <dd className="text-ink">{selected.description}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-muted">
                    <dt>Amount</dt>
                    <dd className="font-semibold text-axiom">{selected.priceLabel}</dd>
                  </div>
                </dl>
                {payError ? <p className="mt-4 text-sm text-red-300">{payError}</p> : null}
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setSelected(null)} className="btn-ghost h-11 flex-1 text-sm">
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void pay()}
                    disabled={checkoutState === "processing"}
                    className="btn-primary h-11 flex-1 text-sm disabled:opacity-60"
                  >
                    {checkoutState === "processing" ? "Opening pay…" : `Pay ${selected.priceLabel}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
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

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{detail}</p>
    </div>
  );
}

function Cell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <p className="text-center text-lg leading-none text-axiom" aria-label="Included">
        ✓
      </p>
    );
  }
  return <p className="text-center text-sm text-zinc-400">{value}</p>;
}
