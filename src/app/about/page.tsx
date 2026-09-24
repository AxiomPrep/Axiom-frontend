import Link from "next/link";
import { PageHeader, Shell } from "@/components/ui";

const POINTS = [
  {
    title: "Precision PYQ archives",
    body: "Over 50,000 official past-year questions from NTA, IIT JEE, and NEET, organised by topic weightage and difficulty.",
  },
  {
    title: "HOD recommended",
    body: "Validated and recommended by HODs of top institutes for structural accuracy and concept alignment.",
  },
  {
    title: "Rank-focused analytics",
    body: "Percentile estimates, speed and accuracy, and leaderboard rankings across nationwide cohorts.",
  },
];

export default function AboutPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="About Axiom Prep"
        title="A quieter engine for the top rank."
        subtitle="Axiom Prep is built for question fidelity, adaptive practice, and step-by-step breakdowns — for JEE, NEET, and Olympiad aspirants who want the work to stay sharp."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {POINTS.map((point, i) => (
          <article key={point.title} className="surface rounded-2xl p-6">
            <p className="font-display text-sm italic text-axiom/70">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{point.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">{point.body}</p>
          </article>
        ))}
      </div>
      <Link href="/practice" className="btn-primary mt-10 h-11 px-6 text-sm">
        Start practicing
      </Link>
    </Shell>
  );
}
