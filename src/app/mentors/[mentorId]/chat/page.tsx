"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChatThread } from "@/components/chat/ChatThread";
import { BrandLoader } from "@/components/BrandLoader";
import { heartbeatPresence, openMentorChat } from "@/lib/chat-api";
import { ApiClientError } from "@/lib/api";

export default function MentorChatPage() {
  const params = useParams<{ mentorId: string }>();
  const mentorId = params.mentorId;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    openMentorChat(mentorId, "direct")
      .then((data) => {
        if (alive) setConversationId(data.conversation_id);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err instanceof ApiClientError && err.status === 402
            ? "An active mentorship plan is required to chat."
            : err instanceof Error
              ? err.message
              : "Could not open chat"
        );
      });
    const tick = window.setInterval(() => void heartbeatPresence(), 25000);
    return () => {
      alive = false;
      window.clearInterval(tick);
    };
  }, [mentorId]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl text-ink">Chat locked</p>
        <p className="mt-3 text-sm text-zinc-400">{error}</p>
        <Link href="/subscription" className="btn-primary mt-6 inline-flex h-11 px-5 text-sm">
          View plans
        </Link>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex justify-center py-24">
        <BrandLoader size="page" label="Opening private chat" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-2 sm:px-6">
      <ChatThread conversationId={conversationId} backHref="/mentors" />
    </div>
  );
}
