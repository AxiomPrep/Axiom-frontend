"use client";

import { FormEvent, useEffect, useState } from "react";
import Script from "next/script";
import { api } from "@/lib/api";
import { getCurrentUser, onAuthChange, signInWithEmail, signOut, signUpWithEmail, type AxiomUser } from "@/lib/auth";
import { getAccessToken } from "@/lib/session";
import { readAccountAccess, type AccountAccess } from "@/lib/entitlement";
import { getPaymentOrders, getPlans, payForPlan, type PaymentOrder, type Plan } from "@/lib/study-api";
import { PageHeader, Shell } from "@/components/ui";

type Cell = true | string;

const MENTOR_WHATSAPP =
  "https://chat.whatsapp.com/LhZMr8pKBwPIYoOuZE4Avv?s=cl&p=a&ilr=4&iam=0";

type Mentor = {
  name: string;
  role: string;
  institute: string;
  highlights: string[];
  tags: string[];
  availability?: string;
};

type MentorshipTier = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  was: string;
  save: string;
  matchKeys: string[];
};

type MentorshipTrack = {
  id: "jee" | "neet";
  eyebrow: string;
  title: string;
  subtitle: string;
  meetHeading: string;
  meetSub: string;
  institutes: string[];
  weeklyCall: string;
  mentors: Mentor[];
  tiers: MentorshipTier[];
  rows: { feature: string; a: Cell; b: Cell }[];
  tierLabels: [string, string];
  note: string;
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Join your mentor group",
    body: "Get added to a WhatsApp group with your mentors and 25–30 aspirants.",
  },
  {
    step: "02",
    title: "Share your targets every day",
    body: "Send daily targets and updates so mentors always know where you stand.",
  },
  {
    step: "03",
    title: "Meet every week",
    body: "A weekly group call for guidance, doubts, and strategy.",
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

const TRACKS: MentorshipTrack[] = [
  {
    id: "jee",
    eyebrow: "IIT-JEE · Mentorship",
    title: "Personal guidance from student mentors of IIT, BITS and ISI.",
    subtitle:
      "The Axiom Prep IIT-JEE Mentorship puts you in a group of 25–30 aspirants with daily direction on strategy, planning, and consistency.",
    meetHeading: "Meet your IIT-JEE Mentors",
    meetSub: "Students of IIT Delhi · IIT Bombay · IIT Guwahati · ISI Kolkata · BITS Pilani · NIT Trichy",
    institutes: ["IIT Delhi", "IIT Bombay", "IIT Guwahati", "BITS Pilani", "ISI Kolkata", "NIT Trichy"],
    weeklyCall: "~45 min",
    mentors: [
      {
        name: "Lakshay Garg",
        role: "B.Tech Candidate, IIT Delhi",
        institute: "IIT Delhi",
        highlights: [
          "AIR 642 in JEE Mains 2025 — 99.964 percentile among 1.5 million candidates",
          "AIR 2499 in JEE Advanced 2025, placing in the top 1% nationally",
          "IOQM (Stage 1) qualifier; also wrote RMO",
          "WorldQuant BRAIN Gold Certification in quantitative finance",
        ],
        tags: ["Calculus", "Linear Algebra", "Python", "Speed Math"],
      },
      {
        name: "Kaushik Tiwari",
        role: "MSc Mathematics, IIT Bombay",
        institute: "IIT Bombay",
        highlights: [
          "AIR 88 in IIT-JAM 2025 — top 0.73% of 12,000+ candidates nationwide",
          "Mathematics teacher at CV Raman International School (Classes 9–12) for 4 years",
          "Doubt solver on Filo for Class 9–12 and JEE Maths",
          "3+ years of one-on-one home tutoring experience",
        ],
        tags: ["Mathematics", "Doubt Solving", "Board + JEE"],
      },
      {
        name: "Aryan Sureshkumar Prajapati",
        role: "B.Tech Mechanical Engineering, IIT Guwahati",
        institute: "IIT Guwahati",
        highlights: [
          "Academic Mentor at JEE Elevate — study planning, time management and structured problem-solving",
          "Built Meffule, a student productivity platform used by 120+ students",
          "Marketing Team Manager, Udgam E-Cell, IIT Guwahati",
        ],
        tags: ["Study Planning", "Time Management", "Mentorship"],
      },
      {
        name: "Vanshu Sharma",
        role: "B.Tech Mechanical Engineering, NIT Trichy",
        institute: "NIT Trichy",
        highlights: [
          "JEE Mains 2025: 99.27 percentile (CRL 11,198); JEE Advanced 2025: Qualified",
          "Finalist, Jitheshraj Scholarship for Promising Freshmen — top 9 of 400+ applicants",
          "Academic tutor at Filo for JEE-level Maths, Physics & Chemistry",
          "YouTube creator on academic guidance — 300K+ views",
        ],
        tags: ["Mathematics", "Physics", "Chemistry", "Content Creation"],
      },
      {
        name: "Himnish Taneja",
        role: "MSc Economics + BE Civil Engineering, BITS Pilani",
        institute: "BITS Pilani",
        highlights: [
          "Subject Matter Expert (Maths & Chemistry) at Khan Academy",
          "Founder of Chem Unbox — JEE Maths & Chemistry community with 16,000+ active learners",
          "1-on-1 mentor at Being IITian — improved student accuracy by 20% across mock cycles",
          "Unnati Head (Mentorship), NSS BITS Pilani",
        ],
        tags: ["Mathematics", "Chemistry", "1-on-1 Mentorship"],
      },
      {
        name: "Lokanath Panda",
        role: "Final-year B.Stat, Indian Statistical Institute Kolkata",
        institute: "ISI Kolkata",
        highlights: [
          "AIR 54 in the ISI Kolkata entrance examination",
          "AIR 1091 in JEE Main 2024",
          "Regular peer teaching and academic mentoring in Mathematics and Physics",
          "One-to-one personal tuition adapted to each student's pace",
        ],
        tags: ["Mathematics", "Physics", "Rigorous Reasoning"],
      },
    ],
    tiers: [
      {
        id: "jee-gold",
        name: "Gold",
        price: 399,
        priceLabel: "₹399",
        was: "₹799",
        save: "₹400",
        matchKeys: ["jee-mentorship-gold", "mentorship-a", "jee mentorship gold"],
      },
      {
        id: "jee-diamond",
        name: "Diamond",
        price: 799,
        priceLabel: "₹799",
        was: "₹1,299",
        save: "₹500",
        matchKeys: ["jee-mentorship-diamond", "mentorship-b", "jee mentorship diamond"],
      },
    ],
    tierLabels: ["Gold", "Diamond"],
    rows: [
      { feature: "WhatsApp group with mentors", a: true, b: true },
      { feature: "Guidance-related doubt solving", a: true, b: true },
      { feature: "Daily targets & updates", a: true, b: true },
      { feature: "Group size", a: "25–30", b: "25–30" },
      { feature: "Weekly group meet call", a: "~45 min", b: "~45 min" },
      { feature: "Strategy, planning & consistency coaching", a: true, b: true },
      { feature: "1-to-1 mentor calls (5 min each)", a: "—", b: "2 calls" },
      { feature: "Exclusive question banks (per subject)", a: "—", b: true },
      { feature: "Academic doubt solving by educators", a: "—", b: true },
      { feature: "Live doubt sessions + recordings", a: "—", b: true },
      { feature: "30-min crisp lectures on most-doubted concepts", a: "—", b: true },
    ],
    note:
      "Diamond students get academic doubts solved by educators with an MSc and PhD, from IIT Bombay, ISI Kolkata, BITS Pilani, and NIT Trichy.",
  },
  {
    id: "neet",
    eyebrow: "NEET · Brilliancy Mentors",
    title: "Personal guidance from NEET rankers — AIR 152 · AIR 166 · AIR 513.",
    subtitle:
      "Brilliancy Mentors puts you in a small group guided by mentors who cracked NEET, with daily direction on strategy, planning, and consistency.",
    meetHeading: "Meet your NEET Mentors",
    meetSub: "Guidance from those who have already cracked NEET",
    institutes: ["Seth GS Medical College", "JIPMER Puducherry", "AIIMS Bhopal"],
    weeklyCall: "~1 hour",
    mentors: [
      {
        name: "Bhavya Kothari",
        role: "NEET 2025 · AIR 152 · MBBS, Seth GS Medical College, Mumbai",
        institute: "Seth GS Medical College",
        availability: "Available on Gold & Platinum",
        highlights: [
          "JEE Mains: 99 percentile · CBSE Class XII: 97% · Class X: 97.8%",
          "Ranked under 10 globally in SOF Math & Science Olympiads (Grade 10)",
          "AIR 160 in ANTHE 2023 and AIR 101 in Tallentex 2023",
        ],
        tags: ["NEET Strategy", "Consistency", "Mentorship"],
      },
      {
        name: "Shayan Abdur Raheem",
        role: "NEET-UG 2025 · AIR 166 · MBBS, JIPMER Puducherry",
        institute: "JIPMER Puducherry",
        availability: "Available on Gold & Platinum",
        highlights: [
          "635 marks in NEET-UG 2025 · JEE Main: 99.14 percentile · CBSE XII: 97.2%",
          "Co-Founder & Mentor, Project Helicase — a student-led NEET mentorship initiative",
          "Class Representative, JIPMER · coordinates batch-level academic matters",
        ],
        tags: ["NEET Mentorship", "Planning", "Peer Leadership"],
      },
      {
        name: "Daivik Ambati",
        role: "NEET 2025 · AIR 513 · MBBS, AIIMS Bhopal",
        institute: "AIIMS Bhopal",
        availability: "Available on Gold only",
        highlights: [
          "3rd overall in batch, First Professional MBBS exams at AIIMS Bhopal",
          "JEE 2025: 99.44 percentile overall, 99.99 percentile in Physics",
          "Principal Investigator on a funded research project at AIIMS Bhopal",
          "Programmes Head, Mission Brain (NGO) · prior mentor on UnchaAi",
        ],
        tags: ["Physics", "Research", "Mentorship"],
      },
    ],
    tiers: [
      {
        id: "neet-gold",
        name: "Gold",
        price: 399,
        priceLabel: "₹399",
        was: "₹1,299",
        save: "₹900",
        matchKeys: ["neet-mentorship-gold", "neet mentorship gold", "brilliancy gold"],
      },
      {
        id: "neet-platinum",
        name: "Platinum",
        price: 849,
        priceLabel: "₹849",
        was: "₹1,999",
        save: "₹1,150",
        matchKeys: ["neet-mentorship-platinum", "neet mentorship platinum", "brilliancy platinum"],
      },
    ],
    tierLabels: ["Gold", "Platinum"],
    rows: [
      { feature: "WhatsApp group with mentors", a: true, b: true },
      { feature: "Guidance-related doubt solving", a: true, b: true },
      { feature: "Daily targets & updates", a: true, b: true },
      { feature: "Group size", a: "25–30", b: "25–30" },
      { feature: "Weekly group meet call", a: "~1 hour", b: "~1 hour" },
      { feature: "Strategy, planning & consistency coaching", a: true, b: true },
      { feature: "1-to-1 mentor calls (5 min each)", a: "—", b: "2 calls" },
      { feature: "Academic doubt solving by educators", a: "—", b: true },
      { feature: "Live doubt sessions + recordings", a: "—", b: true },
      { feature: "30-min crisp lectures on most-doubted concepts", a: "—", b: true },
    ],
    note:
      "Bhavya Kothari and Shayan Abdur Raheem mentor groups are available on Gold and Platinum. Daivik Ambati's mentor group is available on Gold only.",
  },
];

function matchTier(plan: Plan, tier: MentorshipTier, trackId: string) {
  const slug = (plan.slug || "").toLowerCase();
  const hay = `${plan.slug} ${plan.name} ${plan.type} ${plan.mentorship} ${plan.tagline}`.toLowerCase();
  const isNeetPlan = slug.startsWith("neet-") || hay.includes("neet") || hay.includes("brilliancy");
  if (trackId === "neet" && !isNeetPlan) return false;
  if (trackId === "jee" && isNeetPlan) return false;
  return tier.matchKeys.some(
    (key) => slug === key || hay.includes(key) || plan.mentorship === key,
  );
}

export default function SubscriptionPage() {
  const [user, setUser] = useState<AxiomUser | null>(null);
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentMentorship, setCurrentMentorship] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTrack, setActiveTrack] = useState<"jee" | "neet">("jee");
  const [showWhatsAppJoin, setShowWhatsAppJoin] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentOrder[]>([]);

  const loadAccess = () => {
    if (!getAccessToken()) {
      setAccess(null);
      setCurrentMentorship(null);
      setPaymentHistory([]);
      return;
    }
    void Promise.allSettled([
      api<unknown>("/api/me"),
      api<unknown>("/api/student/dashboard"),
      api<Record<string, unknown>>("/api/mentorship"),
      getPaymentOrders(),
    ]).then(([me, dashboard, mentorship, payments]) => {
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
        if (label && label !== "none") {
          setCurrentMentorship(label);
          setShowWhatsAppJoin(true);
        }
      }
      if (payments.status === "fulfilled") {
        setPaymentHistory(payments.value);
      }
    });
  };

  useEffect(() => {
    const stop = onAuthChange(setUser);
    void getPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
    loadAccess();
    return stop;
  }, []);

  useEffect(() => {
    if (user) loadAccess();
  }, [user]);

  const track = TRACKS.find((item) => item.id === activeTrack) || TRACKS[0];
  const displayTiers = track.tiers.map((tier) => {
    const match = plans.find((plan) => matchTier(plan, tier, track.id));
    if (!match) return tier;
    return {
      ...tier,
      id: match.id,
      name: match.name || tier.name,
      price: match.price || tier.price,
      priceLabel: match.priceLabel || tier.priceLabel,
    };
  });

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setNotice(null);
    try {
      if (authMode === "signup") {
        const { user: created, error, needsEmailConfirmation } = await signUpWithEmail({
          email,
          password,
          full_name: fullName,
          phone: "",
          class_level: "12",
          exam_interests: [activeTrack === "neet" ? "neet" : "jee"],
        });
        if (error) {
          setNotice({ type: "err", text: error });
          return;
        }
        if (needsEmailConfirmation) {
          setNotice({ type: "ok", text: "Account created. Confirm the email, then sign in." });
          setAuthMode("signin");
          return;
        }
        if (created) {
          setUser(created);
          setNotice({ type: "ok", text: "Account created. You can enroll in mentorship." });
        }
      } else {
        const { user: signedIn, error } = await signInWithEmail(email, password);
        if (error) {
          setNotice({ type: "err", text: error });
          return;
        }
        if (signedIn) {
          setUser(signedIn);
          setNotice({ type: "ok", text: "Signed in." });
        }
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setAccess(null);
    setCurrentMentorship(null);
    setShowWhatsAppJoin(false);
    setPaymentHistory([]);
    setNotice({ type: "ok", text: "Signed out." });
  };

  const pay = async (tier: MentorshipTier, description: string) => {
    if (!user && !getAccessToken() && !getCurrentUser()) {
      setAuthMode("signin");
      setNotice({
        type: "err",
        text: "Please sign in or create an account before paying — this helps us track your mentor and payment history.",
      });
      window.requestAnimationFrame(() => {
        document.getElementById("mentorship-auth")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(tier.id)) {
      setNotice({
        type: "err",
        text: "This mentorship plan is not available in the catalog yet. Refresh and try again, or contact support.",
      });
      return;
    }
    setPayingId(tier.id);
    setNotice(null);
    setShowWhatsAppJoin(false);
    try {
      await payForPlan(tier.id, {
        name: user?.name || fullName,
        email: access?.email || user?.email || email,
        description,
      });
      setNotice({
        type: "ok",
        text: `Payment confirmed for ${tier.name}. Join the mentors WhatsApp group below.`,
      });
      setCurrentMentorship(`${track.eyebrow.split("·")[0].trim()} · ${tier.name}`);
      setShowWhatsAppJoin(true);
      loadAccess();
    } catch (err) {
      setNotice({ type: "err", text: err instanceof Error ? err.message : "Payment did not complete." });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <Shell>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <PageHeader
        eyebrow="Mentorship"
        title="Axiom Prep — Mentorship"
        subtitle="Choose IIT-JEE or NEET, meet your mentors, and enroll with Razorpay."
      />

      {notice ? (
        <p className={`mb-6 text-sm ${notice.type === "ok" ? "text-axiom" : "text-red-300"}`}>{notice.text}</p>
      ) : null}

      {showWhatsAppJoin ? (
        <section className="surface mb-6 rounded-2xl border border-axiom/40 p-6 sm:p-8">
          <p className="font-display text-lg italic text-axiom">Mentorship enrolled</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Join your mentors on WhatsApp</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Your mentorship is active. Join Axiom&apos;s Mentorship group to meet your mentors, share daily targets, and
            get weekly guidance.
          </p>
          <a
            href={MENTOR_WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-5 inline-flex h-11 items-center px-5 text-sm"
          >
            Join mentors on WhatsApp
          </a>
          <p className="mt-3 break-all text-xs text-zinc-500">{MENTOR_WHATSAPP}</p>
        </section>
      ) : null}

      <section id="mentorship-auth" className="surface rounded-2xl p-6 sm:p-8">
        {user ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg italic text-axiom">Signed in</p>
              <p className="mt-1 text-sm text-zinc-400">{user?.email || access?.email || "Your Axiom Prep account"}</p>
              {currentMentorship || access?.mentorship ? (
                <p className="mt-2 text-sm text-zinc-400">
                  Current mentorship ·{" "}
                  <span className="text-ink">{currentMentorship || access?.mentorship}</span>
                </p>
              ) : null}
            </div>
            <button type="button" onClick={() => void handleSignOut()} className="btn-ghost h-10 px-4 text-sm">
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`h-10 px-4 text-sm ${authMode === "signin" ? "btn-primary" : "btn-ghost"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`h-10 px-4 text-sm ${authMode === "signup" ? "btn-primary" : "btn-ghost"}`}
              >
                Create account
              </button>
            </div>
            <form onSubmit={(event) => void handleAuth(event)} className="grid gap-3 sm:max-w-md">
              {authMode === "signup" ? (
                <label className="block text-sm text-zinc-400">
                  Name
                  <input
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-line bg-transparent px-3 text-ink"
                    placeholder="Your name"
                  />
                </label>
              ) : null}
              <label className="block text-sm text-zinc-400">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-transparent px-3 text-ink"
                  placeholder="aspirant@axiom.app"
                />
              </label>
              <label className="block text-sm text-zinc-400">
                Password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-transparent px-3 text-ink"
                  placeholder="At least 8 characters"
                />
              </label>
              <button type="submit" disabled={authBusy} className="btn-primary mt-2 h-11 text-sm disabled:opacity-60">
                {authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
            <div className="my-5 flex max-w-md items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              <span className="h-px flex-1 bg-line" />
              or continue with
              <span className="h-px flex-1 bg-line" />
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.assign(`/auth/google?next=${encodeURIComponent("/subscription")}`);
              }}
              className="btn-ghost h-11 w-full max-w-md text-sm"
            >
              Google
            </button>
            <p className="mt-3 max-w-md text-xs text-zinc-500">Email and Google both use the Axiom Prep API.</p>
          </>
        )}
      </section>

      <div className="mt-10 mb-8 flex flex-wrap gap-2">
        {TRACKS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTrack(item.id)}
            className={`h-11 px-5 text-sm ${activeTrack === item.id ? "btn-primary" : "btn-ghost"}`}
          >
            {item.id === "jee" ? "IIT-JEE Mentorship" : "NEET Mentorship"}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[13px] font-medium tracking-[0.18em] text-axiom">{track.eyebrow}</p>
      <PageHeader title={track.title} subtitle={track.subtitle} />

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Stat label="Group size" value="25–30" detail="Aspirants per group, so every student gets attention" />
        <Stat label="Weekly" value={track.weeklyCall} detail="Group meet call with your mentors" />
        <Stat label="Daily" value="Targets" detail="Progress updates shared with mentors" />
      </div>

      <section className="mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">Meet your mentors</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{track.meetHeading}</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">{track.meetSub}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {track.mentors.map((mentor) => (
            <article key={mentor.name} className="rounded-2xl border border-line bg-card px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-axiom">{mentor.institute}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{mentor.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{mentor.role}</p>
              {mentor.availability ? <p className="mt-2 text-xs text-axiom">{mentor.availability}</p> : null}
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-400">
                {mentor.highlights.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
              {mentor.tags.length ? (
                <p className="mt-4 text-xs tracking-[0.04em] text-zinc-500">{mentor.tags.join(" · ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-axiom">Mentors come from</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {track.institutes.map((place) => (
            <div key={place} className="rounded-2xl border border-line bg-card px-5 py-5">
              <p className="font-display text-xl font-semibold text-ink">{place}</p>
              <p className="mt-1 text-sm text-zinc-400">Student mentors · Guidance and strategy</p>
            </div>
          ))}
        </div>
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
        <h2 className="mt-2 mb-5 font-display text-3xl font-semibold text-ink">
          {`${track.tierLabels[0]} vs ${track.tierLabels[1]}, side by side.`}
        </h2>
      </section>

      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-card">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-3 border-b border-line px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:px-7">
          <span>Feature</span>
          <span className="text-center text-axiom">{track.tierLabels[0]}</span>
          <span className="text-center text-axiom">{track.tierLabels[1]}</span>
        </div>
        {track.rows.map((row) => (
          <div
            key={row.feature}
            className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-3 border-b border-line/70 px-5 py-3.5 last:border-0 sm:px-7"
          >
            <p className="text-sm text-ink">{row.feature}</p>
            <Cell value={row.a} />
            <Cell value={row.b} />
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

      <p className="mt-5 text-sm leading-relaxed text-zinc-400">{track.note}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {displayTiers.map((tier, index) => (
          <button
            key={tier.id}
            type="button"
            disabled={payingId === tier.id}
            onClick={() => void pay(tier, `${track.eyebrow} · ${tier.name}`)}
            className={`h-12 text-sm disabled:opacity-60 ${index === 1 ? "btn-primary" : "btn-ghost"}`}
          >
            {payingId === tier.id ? "Opening Razorpay…" : `Enroll in ${tier.name} · ${tier.priceLabel}`}
          </button>
        ))}
      </div>

      {user || getAccessToken() ? (
        <section className="surface mt-10 rounded-2xl p-6 sm:p-8">
          <p className="font-display text-lg italic text-axiom">Payment history</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Your mentorship payments</h2>
          <p className="mt-2 text-sm text-zinc-400">Saved against this signed-in account after each checkout.</p>
          {paymentHistory.length ? (
            <div className="mt-5 space-y-3">
              {paymentHistory.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-1 rounded-xl border border-line bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{order.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                      {order.paymentId ? ` · ${order.paymentId}` : ""}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-ink">
                      ₹{order.amountInr.toLocaleString()} {order.currency}
                    </p>
                    <p className="text-xs uppercase tracking-[0.12em] text-axiom">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No payments yet for this account.</p>
          )}
        </section>
      ) : null}
    </Shell>
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
