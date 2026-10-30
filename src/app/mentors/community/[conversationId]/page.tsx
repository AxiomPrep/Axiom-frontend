"use client";

import { useParams } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";

export default function CommunityChatPage() {
  const params = useParams<{ conversationId: string }>();
  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6">
      <ChatThread conversationId={params.conversationId} backHref="/mentors" />
    </div>
  );
}
