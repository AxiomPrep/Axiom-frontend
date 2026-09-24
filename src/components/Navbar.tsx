"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { onAuthChange, refreshSession, signOut, type AxiomUser } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/pyq-bank", label: "PYQs" },
  { href: "/originals", label: "Originals" },
  { href: "/top-teachers", label: "Teachers" },
  { href: "/timer", label: "Study Hub" },
  { href: "/leaderboard", label: "Ranks" },
];

const MENU: { href: string; label: string; detail?: string }[] = [
  { href: "/mentorship", label: "Mentorship", detail: "IIT JEE Gold and Diamond" },
  { href: "/subscription", label: "Subscription", detail: "Trial and platform access" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
  { href: "/originals/community", label: "Community" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AxiomUser | null>(null);
  const menuActive = MENU.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );

  useEffect(() => {
    const stop = onAuthChange(setUser);
    void refreshSession();
    return stop;
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-[color:var(--chrome)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Axiom Prep home">
          <Logo variant="mark" priority />
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/timer"
                  ? pathname === "/timer" || pathname === "/study-hub" || pathname.startsWith("/timer/")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap transition ${
                  active ? "text-ink" : "text-zinc-400 hover:text-ink"
                }`}
              >
                {link.label}
                {active ? (
                  <span className="absolute inset-x-2 -bottom-0.5 h-px rounded-full bg-axiom" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-zinc-300 transition ${
                open || menuActive ? "border-axiom text-ink" : "border-line hover:border-axiom/50 hover:text-ink"
              }`}
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-3 bg-current" />
              </span>
            </button>
            {open ? (
              <div className="absolute right-0 top-[3.25rem] z-50 min-w-44 rounded-2xl border border-line bg-[color:var(--chrome-solid)] p-2 shadow-xl">
                {MENU.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-sm ${
                        active ? "text-ink" : "text-muted hover:bg-white/5 hover:text-ink"
                      }`}
                    >
                      <span className="block">{link.label}</span>
                      {"detail" in link && link.detail ? (
                        <span className="mt-0.5 block text-[11px] text-zinc-500">{link.detail}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
          <ThemeToggle />
          {user ? (
            <button type="button" onClick={() => void signOut()} className="btn-ghost h-9 px-4 text-sm">
              Log out
            </button>
          ) : (
            <Link href="/login" className="btn-primary h-9 px-4 text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
