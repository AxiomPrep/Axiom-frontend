"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { hasAccessToken } from "@/lib/session";
import { isPublicSitePath, loginRedirect } from "@/lib/auth-paths";

export function AuthBarrier({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const publicPath = isPublicSitePath(pathname);
  const authed = hasAccessToken();

  useEffect(() => {
    if (publicPath || authed) return;
    const search = searchParams?.toString();
    router.replace(loginRedirect(pathname, search ? `?${search}` : ""));
  }, [authed, pathname, publicPath, router, searchParams]);

  if (!publicPath && !authed) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24 text-sm text-zinc-400">
        Sign in required. Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}
