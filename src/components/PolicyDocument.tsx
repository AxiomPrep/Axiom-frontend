import Link from "next/link";
import { PageHeader, Shell } from "@/components/ui";
import {
  ALL_POLICIES,
  POLICY_LAST_UPDATED,
  type PolicyDoc,
} from "@/data/policies";

export function PolicyDocument({ doc }: { doc: PolicyDoc }) {
  return (
    <Shell>
      <p className="mb-6 text-[13px] font-medium tracking-wide text-axiom">
        <Link href="/" className="hover:text-axiom-hover">
          Home
        </Link>
        <span className="mx-1.5 text-axiom/50">/</span>
        <Link href="/policies" className="hover:text-axiom-hover">
          Policies
        </Link>
        <span className="mx-1.5 text-axiom/50">/</span>
        <span className="text-zinc-300">{doc.title}</span>
      </p>

      <PageHeader
        eyebrow="Axiom Prep"
        title={doc.title}
        subtitle={`Last updated: ${POLICY_LAST_UPDATED}`}
      />

      <nav className="mb-10 flex flex-wrap gap-3 text-sm">
        {ALL_POLICIES.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`rounded-full border px-4 py-2 transition ${
              item.id === doc.id
                ? "border-axiom/50 bg-axiom/10 text-axiom"
                : "border-line text-zinc-400 hover:border-axiom/40 hover:text-ink"
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <article className="mx-auto max-w-3xl">
        <p className="text-[1.05rem] leading-relaxed text-zinc-400">{doc.intro}</p>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section) => {
            const paragraphs = section.paragraphs || [];
            const leadCount = section.bullets?.length ? Math.min(1, paragraphs.length) : paragraphs.length;
            const before = paragraphs.slice(0, leadCount);
            const after = paragraphs.slice(leadCount);
            return (
              <section key={section.heading}>
                <h2 className="font-display text-2xl font-semibold text-ink">{section.heading}</h2>
                {before.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
                    {section.bullets.map((bullet) => (
                      <li key={bullet.slice(0, 64)}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {after.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </section>
            );
          })}
        </div>

        <p className="mt-12 border-t border-line/70 pt-6 text-xs text-zinc-600">
          Questions? Email{" "}
          <a className="text-axiom hover:text-axiom-hover" href="mailto:team.axiomprep8118@gmail.com">
            team.axiomprep8118@gmail.com
          </a>
          .
        </p>
      </article>
    </Shell>
  );
}
