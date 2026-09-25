export function isPublicSitePath(pathname: string) {
  if (pathname === "/" || pathname === "") return true;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/catalog/") ||
    pathname.startsWith("/admin-api/")
  );
}

export function loginRedirect(pathname: string, search = "") {
  const next = `${pathname}${search}`;
  if (!next || next === "/" || next.startsWith("/login")) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

export function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) {
    return "/practice";
  }
  return next;
}
