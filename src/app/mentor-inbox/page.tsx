"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Shell } from "@/components/ui";
import { PageLoader } from "@/components/BrandLoader";
import { heartbeatPresence, listConversations, type ChatConversation } from "@/lib/chat-api";

export default function MentorInboxPage() {
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listConversations(true)
      .then((data) => {
        if (alive) setItems(data.conversations.filter((row) => row.member_role === "mentor" || row.member_role === "admin"));
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load inbox");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    void heartbeatPresence();
    const tick = window.setInterval(() => {
      void heartbeatPresence();
      void listConversations().then((data) => {
        setItems(data.conversations.filter((row) => row.member_role === "mentor" || row.member_role === "admin"));
      });
    }, 45000);
    return () => {
      alive = false;
      window.clearInterval(tick);
    };
  }, []);

  if (loading) {
    return (
      <Shell>
        <PageLoader label="Inbox" />
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Mentor inbox"
        title="All assigned student conversations in one place"
        subtitle="Reply from Axiom Prep. Students and mentors use the same chat, with a different inbox for each role."
      />
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-8 text-sm text-zinc-400">
            No conversations yet. When a subscribed student messages you, it will appear here.
          </p>
        ) : (
          items.map((row) => (
            <Link
              key={row.id}
              href={`/mentor-inbox/${row.id}`}
              className="block rounded-2xl border border-line bg-card px-5 py-4 hover:border-axiom/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl text-ink">{row.peer_name || row.title || "Conversation"}</p>
                  <p className="mt-1 text-sm text-zinc-400">{row.last_message_preview || "No messages yet"}</p>
                  <p className="mt-2 text-xs text-axiom">
                    {row.kind === "community" ? "Group discussion" : row.online ? "Online" : "Student chat"}
                  </p>
                </div>
                {row.unread ? (
                  <span className="rounded-full bg-axiom px-2 py-1 text-xs text-black">{row.unread} new</span>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </Shell>
  );
}
