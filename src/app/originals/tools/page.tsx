"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOL_KIND_LABELS } from "@/lib/catalog";
import { readerHref } from "@/lib/reader";
import { useApi } from "@/lib/use-api";
import { OriginalsMark } from "@/components/OriginalsMark";
import { ApiStatus, Breadcrumbs, EmptyState, LoadingBlock, PageHeader, Pill, Shell } from "@/components/ui";

type Tool = {
  id: string;
  kind: string;
  title: string;
  external_url: string | null;
  storage_path: string | null;
  class_level: string | null;
  read_url?: string | null;
};

export default function ToolsPage() {
  const [kind, setKind] = useState<string>("");
  const path = kind ? `/catalog/originals/tools?kind=${kind}` : "/catalog/originals/tools";
  const { data, error, loading } = useApi<{ tools: Tool[]; kinds: string[] }>(path);
  const kinds = data?.kinds ?? Object.keys(TOOL_KIND_LABELS);
  const tools = data?.tools ?? [];

  return (
    <Shell>
      <Breadcrumbs items={[{ href: "/originals", label: "Originals" }, { label: "Important Tools" }]} />
      <PageHeader
        mark={<OriginalsMark id="tools" size="lg" />}
        title="Important Tools"
        subtitle="Mindmaps, short notes, formula sheets, laws, reactions, and diagrams."
      />
      <ApiStatus error={error} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Pill active={!kind} onClick={() => setKind("")}>
          All
        </Pill>
        {kinds.map((k) => (
          <Pill key={k} active={kind === k} onClick={() => setKind(k)}>
            {TOOL_KIND_LABELS[k] || k}
          </Pill>
        ))}
      </div>
      {loading ? <LoadingBlock /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kinds
          .filter((k) => !kind || k === kind)
          .map((k) => {
            const group = tools.filter((t) => t.kind === k);
            return (
              <div key={k} className="surface rounded-2xl p-5">
                <p className="text-sm font-semibold text-axiom">{TOOL_KIND_LABELS[k] || k}</p>
                <p className="mt-3 text-lg font-bold">{group.length} resource{group.length === 1 ? "" : "s"}</p>
                <div className="mt-3 space-y-2">
                  {group.length ? (
                    group.map((t) => (
                      <Link
                        key={t.id}
                        href={readerHref({
                          source: "tool",
                          id: t.id,
                          title: t.title,
                          url: t.read_url || t.external_url,
                        })}
                        className="block text-sm text-zinc-300 hover:text-white"
                      >
                        {t.title}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">Coming soon</p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      {!loading && tools.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No tools published yet" body="Upload a PDF or PDF link for a tool kind on the admin desk." />
        </div>
      ) : null}
    </Shell>
  );
}
