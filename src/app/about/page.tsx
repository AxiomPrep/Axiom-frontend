import Image from "next/image";
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

const GROUPS = [
  {
    title: "Tech Team",
    people: ["Gauri Shukla", "Ayush Kumar", "Srinivas"],
  },
  {
    title: "Content Making Team",
    people: ["Shruti Sharma", "Ayush Raj", "Ajinkya", "Himnish", "Loknath Panda"],
  },
  {
    title: "Mentors",
    people: ["Bhavya Kothari", "Shayan Raheem", "Daivik Ambati"],
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const TEAM = [
  {
    name: "Dhairya Vyas",
    role: "Founder and CEO",
    src: "/team/dhairya-vyas.png",
  },
  {
    name: "Tanishq Kansal",
    role: "Co-founder and COO",
    src: "/team/tanishq-kansal.png",
  },
  {
    name: "Ayush Kumar",
    role: "CTO",
    src: "/team/ayush-kumar.png",
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

      <section className="mt-14">
        <p className="font-display text-lg italic text-axiom">The team</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Who builds Axiom Prep</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((person) => (
            <article key={person.name} className="surface overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/5] bg-zinc-900">
                <Image
                  src={person.src}
                  alt={`${person.name}, ${person.role} of Axiom Prep`}
                  fill
                  className="object-cover object-top"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">{person.role}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{person.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-14">
          <p className="font-display text-lg italic text-axiom">{group.title}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.people.map((name) => (
              <article key={name} className="surface flex items-center gap-4 rounded-2xl p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-axiom/30 bg-axiom/10 font-display text-lg font-semibold text-axiom">
                  {initials(name)}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">{name}</h3>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-muted">{group.title}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <Link href="/practice" className="btn-primary mt-10 h-11 px-6 text-sm">
        Start practicing
      </Link>
    </Shell>
  );
}
