"use client";

import { useParams } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";

export default function MentorThreadPage() {
  const params = useParams<{ conversationId: string }>();
  return (
    <div className="mx-auto max-w-3xl px-3 py-2 sm:px-6">
      <ChatThread conversationId={params.conversationId} backHref="/mentor" />
    </div>
  );
}
