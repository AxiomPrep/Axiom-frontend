"use client";

import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, LoadingBlock, PageHeader, Shell } from "@/components/ui";

export default function CommunityPage() {
  const { data, error, loading } = useApi<{
    title: string;
    description: string;
    discord_invite_url: string;
  }>("/api/community/discord");

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Community" }]} />
      <PageHeader
        mark={<OriginalsMark id="community" size="lg" />}
        title={data?.title || "Axiom Prep Community"}
        subtitle={data?.description || "Doubt-solving, peer interaction, and direct mentorship on Discord."}
      />
      <ApiStatus error={error} />
      {loading ? <LoadingBlock /> : null}
      <div className="max-w-xl rounded-2xl border border-axiom/40 bg-axiom/10 p-8">
        <p className="text-lg font-bold">Join the Axiom Prep Community</p>
        <p className="mt-2 text-sm text-zinc-300">Uses the invite returned by the community API.</p>
        <a
          href={data?.discord_invite_url || "https://discord.gg/axiom"}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-5 h-10 px-5 text-sm"
        >
          Open Discord
        </a>
      </div>
    </Shell>
  );
}
