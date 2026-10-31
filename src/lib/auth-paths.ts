export function isPublicSitePath(pathname: string) {
  if (pathname === "/" || pathname === "") return true;
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/policies") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/catalog/") ||
    pathname.startsWith("/admin-api/") ||
    pathname.startsWith("/brochures/") ||
    pathname === "/mentors" ||
    pathname === "/home" ||
    /^\/google[a-z0-9]+\.html$/i.test(pathname)
  );
}

export function loginRedirect(pathname: string, search = "") {
  const next = `${pathname}${search}`;
  if (!next || next === "/" || next.startsWith("/login")) return "/login?next=%2Fmentors";
  return `/login?next=${encodeURIComponent(next)}`;
}

export function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login") || next === "/") {
    return "/mentors";
  }
  return next;
}

export function landingPath(next: string, role?: { isMentor?: boolean; isAdmin?: boolean } | null) {
  const isAdmin = Boolean(role?.isAdmin);
  const isMentor = Boolean(role?.isMentor);
  if (!isAdmin && (next === "/admin" || next.startsWith("/admin/"))) {
    return isMentor ? "/mentor" : "/mentors";
  }
  if (
    isAdmin &&
    (next === "/mentors" || next === "/home" || next === "/mentor" || next === "/mentor-inbox" || next.startsWith("/mentor-inbox"))
  ) {
    return "/admin";
  }
  if (isMentor && (next === "/mentors" || next === "/home" || next === "/mentor-inbox")) return "/mentor";
  return next;
}
