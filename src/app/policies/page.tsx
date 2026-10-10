import Link from "next/link";
import { PageHeader, Shell } from "@/components/ui";
import { ALL_POLICIES, POLICY_LAST_UPDATED } from "@/data/policies";

export const metadata = {
  title: "Policies · Axiom Prep",
  description: "Terms and Conditions, Refund Policy, and Privacy Policy for Axiom Prep.",
};

export default function PoliciesPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Legal"
        title="Policies"
        subtitle={`Terms and Conditions · Refund Policy · Privacy Policy. Last updated ${POLICY_LAST_UPDATED}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {ALL_POLICIES.map((policy, index) => (
          <Link
            key={policy.id}
            href={policy.href}
            className="surface surface-hover block rounded-2xl p-6 transition"
          >
            <p className="font-display text-sm italic text-axiom/70">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">{policy.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 line-clamp-3">{policy.intro}</p>
            <p className="mt-5 text-sm text-axiom">Read full policy →</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
