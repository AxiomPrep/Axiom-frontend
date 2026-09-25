import Link from "next/link";
import { PageHeader, Shell } from "@/components/ui";

export default function ComingSoonPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Coming soon"
        title="This page is not open yet."
        subtitle="Discord and the community are being set up. Check back shortly."
      />
      <div className="surface max-w-xl rounded-2xl p-8">
        <p className="text-sm leading-relaxed text-zinc-400">
          Practice, PYQs, teachers, and Important Tools stay available while we finish community.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex h-11 items-center px-6 text-sm">
          Back to home
        </Link>
      </div>
    </Shell>
  );
}
