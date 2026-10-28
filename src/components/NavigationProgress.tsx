"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { markNavigating, markNavigationDone, subscribeNavProgress } from "@/lib/nav-progress";

function isInternalNav(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    return url.pathname !== window.location.pathname || url.search !== window.location.search;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => subscribeNavProgress(setPending), []);

  useEffect(() => {
    markNavigationDone();
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (anchor instanceof HTMLAnchorElement && isInternalNav(anchor, event)) {
        markNavigating();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("axiom-ready");
  }, []);

  if (!pending) return null;

  return (
    <div className="axiom-nav-overlay" role="status" aria-live="polite" aria-label="Loading page">
      <div className="axiom-nav-bar" />
      <BrandLoader size="mark" label="Opening" />
    </div>
  );
}
