import Link from "next/link";
import { OriginalsMark } from "@/components/OriginalsMark";

const STATS = [
  { value: "4.8/5", label: "Practice experience" },
  { value: "95%", label: "Students see improvement" },
  { value: "Top choice", label: "For JEE, NEET & Olympiads" },
  { value: "Exam ready", label: "Chapter-wise mastery path" },
];

const DISCOVER = [
  {
    title: "The science behind everyday phenomena",
    detail: "Physics, Chemistry, Mathematics & Biology from first principles",
  },
  { title: "Product updates from Axiom Prep" },
  {
    title: "Behind-the-scenes of building the platform",
    detail: "Conversations with educators, researchers, and creators",
  },
  { title: "The future of learning" },
];

const VALIDATED_BY = [
  { name: "ABJ Sir", role: "Co-founder of Competishun" },
  { name: "GB Sir", role: "Co-founder of IIT School" },
  { name: "HODs from Allen, Aakash, and Narayana", role: "IIT KGP CSE alumnus" },
];

const PILLARS = [
  {
    title: "Faculty first",
    body: "Learn from teachers whose classrooms have produced top AIRs — lectures, problem solving, and PYQs in one place.",
  },
  {
    title: "Practice with intent",
    body: "Tiered quizzes, custom tests, and full syllabus mocks designed on the latest NTA and JAB patterns.",
  },
  {
    title: "Know where you stand",
    body: "Prep Tracker, Improvement Book, and study sequences keep revision honest instead of hopeful.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
        <h1 className="max-w-4xl font-display text-[2.85rem] font-semibold leading-[1.08] text-ink sm:text-[4.15rem] sm:leading-[1.04]">
          One Place For All Your Science Needs
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink">This platform is where you&apos;ll discover:</p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {DISCOVER.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-400">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-axiom" />
              <span>
                <span className="text-ink">{item.title}</span>
                {item.detail ? <span className="text-zinc-500"> · {item.detail}</span> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-lg text-zinc-400">Because understanding changes everything.</p>
        <p className="mt-2 font-display text-base italic text-axiom">Explore. Question. Understand.</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">
          Our platform is validated by
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {VALIDATED_BY.map((person) => (
            <article key={person.name} className="surface rounded-2xl p-6">
              <h3 className="font-display text-2xl font-semibold text-ink">{person.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{person.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="surface grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-card px-5 py-6">
              <p className="gold-text font-display text-3xl font-semibold leading-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-xs tracking-wide text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/top-teachers" className="surface surface-hover group rounded-2xl p-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-axiom">TOP TEACHERS</p>
            <h2 className="mt-3 font-display text-[2rem] font-semibold leading-tight">Learn from the masters</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Filter by subject, open a profile, pick a chapter, and start a lecture with notes and
              related PYQs.
            </p>
            <p className="mt-6 text-sm font-medium text-axiom group-hover:text-axiom-hover">
              Enter directory →
            </p>
          </Link>
          <Link href="/originals" className="surface surface-hover group rounded-2xl p-8">
            <div className="mb-4 flex items-center gap-3">
              <OriginalsMark id="modules" size="sm" />
              <p className="text-xs font-semibold tracking-[0.2em] text-axiom">AXIOM PREP ORIGINALS</p>
            </div>
            <h2 className="mt-3 font-display text-[2rem] font-semibold leading-tight">Ten modules. One system.</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Tools, quizzes, custom tests, Improvement Book, Prep Tracker, and full syllabus mocks.
            </p>
            <p className="mt-6 text-sm font-medium text-axiom group-hover:text-axiom-hover">
              Open the hub →
            </p>
          </Link>
          <Link href="/study-hub" className="surface surface-hover group rounded-2xl p-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-axiom">STUDY HUB</p>
            <h2 className="mt-3 font-display text-[2rem] font-semibold leading-tight">Timer, To-Do, NCERT</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Subject-wise focus sessions, yesterday’s leftover targets, and a page-flip NCERT shelf.
            </p>
            <p className="mt-6 text-sm font-medium text-axiom group-hover:text-axiom-hover">
              Open Study Hub →
            </p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <p className="font-display text-lg italic text-zinc-500">Why Axiom Prep</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PILLARS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line/80 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
