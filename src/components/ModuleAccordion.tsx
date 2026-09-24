"use client";

import Link from "next/link";
import { useState } from "react";
import { ChapterMark, ChapterMarkId } from "@/components/ChapterMark";
import { ContentItem, formatDuration } from "@/lib/api";
import { CHAPTER_MODULES } from "@/lib/catalog";
import { isPdfModule, readerHref } from "@/lib/reader";

export function ModuleAccordion({
  grouped,
  itemHref,
}: {
  grouped: Record<string, ContentItem[]>;
  itemHref: (item: ContentItem, moduleKey: string) => string;
}) {
  const [open, setOpen] = useState<string | null>("lectures");

  return (
    <div className="space-y-3">
      {CHAPTER_MODULES.map((mod) => {
        const items = grouped[mod.key] || [];
        const expanded = open === mod.key;
        return (
          <div key={mod.key} className="surface overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : mod.key)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
              aria-expanded={expanded}
            >
              <ChapterMark id={mod.key as ChapterMarkId} size="sm" />
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold leading-tight">{mod.title}</span>
                <span className="mt-0.5 block text-sm text-zinc-500">{mod.subtitle}</span>
              </span>
              <span className="rounded-full border border-axiom/25 px-2.5 py-1 text-xs text-axiom/80">
                {items.length}
              </span>
              <svg
                viewBox="0 0 16 16"
                className={`h-4 w-4 text-axiom/80 transition ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {expanded ? (
              <div className="border-t border-line/70 px-3 pb-3 pt-1">
                {items.length ? (
                  items.map((item) => {
                    const pdf = isPdfModule(mod.key, item.type);
                    const href = pdf
                      ? readerHref({
                          source: "content",
                          id: item.id,
                          title: item.title,
                          url: item.external_url,
                        })
                      : itemHref(item, mod.key);
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/[0.04]"
                      >
                        <span>
                          <span className="block font-medium">{item.title}</span>
                          {item.description ? (
                            <span className="mt-0.5 block text-sm text-zinc-500">{item.description}</span>
                          ) : null}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDuration(item.duration_sec) || (pdf ? "Open book" : "Play")}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-sm text-zinc-500">Nothing published in this module yet.</p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
