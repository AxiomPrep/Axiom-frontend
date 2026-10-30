"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthChange } from "@/lib/auth";
import { listNotifications } from "@/lib/chat-api";
import { pingBrowserNotification, subscribeNotifications } from "@/lib/chat-realtime";

export function ChatNotifyListener() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    return onAuthChange((user) => {
      setUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const notices = await listNotifications();
        if (!cancelled) setUnread(notices.unread_count || 0);
      } catch {
        // Ignore notification refresh errors.
      }
    }

    const later = window.setTimeout(() => {
      void refresh();
    }, 1200);

    const unsubscribe = subscribeNotifications(userId, (row) => {
      if (cancelled) return;
      setUnread((count) => count + 1);
      pingBrowserNotification(
        String(row.title || "Axiom Prep"),
        String(row.body || "New message"),
      );
    });

    const tick = window.setInterval(() => {
      void refresh();
    }, 45_000);

    return () => {
      cancelled = true;
      window.clearTimeout(later);
      window.clearInterval(tick);
      unsubscribe();
    };
  }, [userId]);

  if (!userId) return null;

  const href = pathname.startsWith("/mentor-inbox") ? "/mentor-inbox" : "/mentors";

  return (
    <Link
      href={href}
      className="relative inline-flex h-10 items-center px-2 text-sm text-zinc-300 hover:text-ink"
    >
      Chat
      {unread > 0 ? (
        <span className="ml-1 rounded-full bg-axiom px-1.5 py-0.5 text-[10px] font-semibold text-black">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
