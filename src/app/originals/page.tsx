"use client";

import Link from "next/link";
import { OriginalsMark, OriginalsMarkId } from "@/components/OriginalsMark";
import { ORIGINALS_TILES } from "@/lib/catalog";
import { PageHeader, Shell } from "@/components/ui";

export default function OriginalsHubPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Curriculum system"
        title="Axiom Prep Originals"
        subtitle="Eleven modules for tools, quizzes, custom tests, tracking, Study Hub, and full syllabus mocks."
      />
      <p className="-mt-6 mb-10 text-sm text-zinc-500">
        Timer, To-Do, and NCERT open in{" "}
        <Link href="/study-hub" className="font-semibold text-axiom hover:text-axiom-hover">
          Study Hub
        </Link>
        .
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORIGINALS_TILES.map((tile, i) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="surface surface-hover originals-tile group flex min-h-[188px] flex-col justify-between rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <OriginalsMark id={tile.id as OriginalsMarkId} />
              <span className="font-display text-sm italic text-axiom/55">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div>
              <h2 className="font-display text-[1.45rem] font-semibold leading-tight tracking-tight">
                {tile.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{tile.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm text-zinc-500">
        Plans and payment are on the subscription page.{" "}
        <Link href="/subscription" className="font-semibold text-axiom hover:text-axiom-hover">
          Open subscription
        </Link>
      </p>
    </Shell>
  );
}
