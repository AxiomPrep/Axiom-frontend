import Link from "next/link";
import { OriginalsMark } from "@/components/OriginalsMark";
import { Breadcrumbs, PageHeader, Shell } from "@/components/ui";

export default function CommunityPage() {
  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Community" }]} />
      <PageHeader
        mark={<OriginalsMark id="community" size="lg" />}
        title="Axiom Prep Community"
        subtitle="Doubt-solving, peer discussion, and mentorship. Discord opens when the server is ready."
      />
      <div className="max-w-xl rounded-2xl border border-axiom/40 bg-axiom/10 p-8">
        <p className="text-lg font-bold">Join the Axiom Prep Community</p>
        <p className="mt-2 text-sm text-zinc-300">
          The community page is live. The Discord invite is not open yet.
        </p>
        <Link href="/coming-soon" className="btn-primary mt-5 inline-flex h-10 items-center px-5 text-sm">
          Open Discord
        </Link>
      </div>
    </Shell>
  );
}
