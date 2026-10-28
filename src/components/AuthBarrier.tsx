"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { hasAccessToken } from "@/lib/session";
import { isPublicSitePath, loginRedirect } from "@/lib/auth-paths";

export function AuthBarrier({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const publicPath = isPublicSitePath(pathname);
  const authed = hasAccessToken();
  const href = loginRedirect(pathname);

  useEffect(() => {
    if (publicPath || authed) return;
    router.replace(loginRedirect(pathname, window.location.search));
  }, [authed, pathname, publicPath, router]);

  if (!publicPath && !authed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24">
        <BrandLoader size="page" label="Sign in to continue" />
        <Link href={href} className="btn-primary h-11 px-6 text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
