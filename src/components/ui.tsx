"use client";

import type { ReactNode } from "react";
import { ApiClientError, isUnauthorized } from "@/lib/api";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  mark,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  mark?: ReactNode;
}) {
  return (
    <div className="mb-10 flex items-start gap-5">
      {mark ? <div className="mt-1 shrink-0">{mark}</div> : null}
      <div>
        {eyebrow ? (
          <p className="mb-3 font-display text-lg italic font-medium text-axiom">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-[3.25rem] sm:leading-[1.08]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <p className="mb-7 text-[13px] font-medium tracking-wide text-axiom">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 ? <span className="mx-1.5 text-axiom/50">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-axiom-hover">
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-300">{item.label}</span>
          )}
        </span>
      ))}
    </p>
  );
}

export function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium tracking-wide transition ${
        active
          ? "bg-axiom text-black shadow-[0_8px_20px_rgba(212,161,90,0.25)]"
          : "border border-line bg-white/[0.03] text-zinc-300 hover:border-axiom/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="surface rounded-2xl px-6 py-16 text-center">
      <div className="mx-auto mb-4 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-axiom/80" style={{ animation: "shimmer 1.2s infinite" }} />
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-axiom/20 bg-white/[0.02] px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">{body}</p> : null}
    </div>
  );
}

export function ApiStatus({ error }: { error: ApiClientError | null }) {
  if (!error) return null;
  if (isUnauthorized(error)) {
    return (
      <div className="mb-6 rounded-2xl border border-axiom/25 bg-axiom/[0.07] px-5 py-4">
        <p className="font-semibold text-axiom">Sign in to load live data</p>
        <p className="mt-1 text-sm text-zinc-400">Log in so this page can load from the Axiom Prep API.</p>
        <Link href="/login" className="btn-primary mt-3 h-8 px-4 text-sm">
          Go to Login
        </Link>
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-200">
      {error.message}
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">{children}</div>;
}
