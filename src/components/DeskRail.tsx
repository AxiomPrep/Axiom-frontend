import Link from "next/link";
import type { AdminContent } from "@/lib/admin";
import { deskKindLabel, deskOpenHref } from "@/lib/desk-catalog";

export function DeskRail({ items, title = "Uploaded for this filter" }: { items: AdminContent[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 rounded-2xl border border-axiom/25 bg-axiom/[0.06] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-axiom">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={deskOpenHref(item)}
            className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-sm hover:bg-black/35"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">{item.title}</span>
              <span className="text-xs text-zinc-500">{deskKindLabel(item)}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-axiom">Open</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
