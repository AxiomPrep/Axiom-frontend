import { NextRequest, NextResponse } from "next/server";
import { isPublicSitePath, loginRedirect } from "@/lib/auth-paths";

function hasSession(req: NextRequest) {
  const token = req.cookies.get("axiom_access_token")?.value;
  return Boolean(token && token.length > 20 && !token.startsWith("google."));
}

function isOpenApiPath(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/admin-api") ||
    pathname === "/api/plans" ||
    pathname === "/api/signup" ||
    pathname === "/api/signin" ||
    pathname === "/api/login" ||
    pathname === "/api/register"
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/catalog/")) {
    if (isOpenApiPath(pathname) || hasSession(req) || req.headers.get("authorization")?.startsWith("Bearer ")) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "unauthorized", message: "Sign in to open this content." }, { status: 401 });
  }

  if (isPublicSitePath(pathname)) return NextResponse.next();
  if (hasSession(req)) return NextResponse.next();

  return NextResponse.redirect(new URL(loginRedirect(pathname, search), req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
