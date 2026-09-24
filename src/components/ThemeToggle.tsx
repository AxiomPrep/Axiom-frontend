"use client";

import { useEffect, useState } from "react";

const KEY = "axiom-theme";

export type ThemeName = "dark" | "light";

export function readTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(KEY);
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "light" ? "light" : readTheme());
  }, []);

  function toggle() {
    const next: ThemeName = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl"
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Dark theme" : "Light theme"}
    >
      {isLight ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M12 3v2.1M12 18.9V21M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M3 12h2.1M18.9 12H21M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M16.4 13.2A6.4 6.4 0 0 1 10.8 5.4 6.6 6.6 0 1 0 18.6 15a6.3 6.3 0 0 1-2.2-1.8Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
