"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getConversation,
  listMessages,
  markConversationRead,
  sendMessage,
  uploadChatFile,
  type ChatMessage,
} from "@/lib/chat-api";
import { enableBrowserNotifications, pingBrowserNotification, subscribeConversation } from "@/lib/chat-realtime";
import { BrandLoader } from "@/components/BrandLoader";

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function ChatThread({
  conversationId,
  backHref,
}: {
  conversationId: string;
  backHref: string;
}) {
  const me = getCurrentUser()?.id || "";
  const [title, setTitle] = useState("Chat");
  const [subtitle, setSubtitle] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<Record<string, string>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function merge(next: ChatMessage) {
    setMessages((current) => {
      if (current.some((row) => row.id === next.id)) return current;
      return [...current, next].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }

  useEffect(() => {
    let alive = true;
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const [detail, history] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
        if (!alive) return;
        const heading =
          detail.membership.member_role === "mentor"
            ? detail.peer?.full_name || detail.conversation.title || "Student"
            : detail.mentor?.full_name || detail.conversation.title || "Mentor";
        setTitle(heading);
        setSubtitle(
          detail.conversation.kind === "community"
            ? "Group discussion"
            : detail.conversation.kind === "announcements"
              ? "Announcements"
              : detail.mentor?.institute || "Private chat"
        );
        const reads: Record<string, string> = {};
        for (const member of detail.members) {
          if (member.last_read_at) reads[member.user_id] = member.last_read_at;
        }
        setReadAt(reads);
        setMessages(history.messages);
        await markConversationRead(conversationId);
        void enableBrowserNotifications();
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not open chat");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void boot();
    const unsubscribe = subscribeConversation(conversationId, (incoming) => {
      merge(incoming);
      if (incoming.sender_id !== me) {
        pingBrowserNotification("Axiom Prep", incoming.content || "New message");
        void markConversationRead(conversationId);
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [conversationId, me]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, loading]);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      const result = await sendMessage(conversationId, { content, message_type: "text" });
      merge(result.message);
    } catch (err) {
      setText(content);
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setSending(true);
    try {
      const result = await uploadChatFile(conversationId, file);
      merge(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send file");
    } finally {
      setSending(false);
    }
  }

  const days = useMemo(() => {
    const groups: { day: string; items: ChatMessage[] }[] = [];
    for (const item of messages) {
      const day = formatDay(item.created_at);
      const last = groups[groups.length - 1];
      if (!last || last.day !== day) groups.push({ day, items: [item] });
      else last.items.push(item);
    }
    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <BrandLoader size="page" label="Opening chat" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col rounded-[1.5rem] border border-line bg-card">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link href={backHref} className="text-sm text-axiom hover:text-axiom-hover">
          Back
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
      </header>
      {error ? <p className="px-4 py-2 text-sm text-red-300">{error}</p> : null}
      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {days.map((group) => (
          <section key={group.day}>
            <p className="mb-3 text-center text-[11px] tracking-[0.14em] text-zinc-500">{group.day}</p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const mine = item.sender_id === me;
                const othersRead = Object.entries(readAt).some(
                  ([userId, at]) => userId !== me && at >= item.created_at
                );
                return (
                  <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mine ? "bg-axiom text-black" : "bg-white/5 text-ink"
                      }`}
                    >
                      {item.message_type === "image" && item.attachment_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.attachment_url} alt={item.content || "Photo"} className="mb-2 max-h-64 rounded-xl" />
                      ) : null}
                      {item.message_type === "file" && item.attachment_url ? (
                        <a href={item.attachment_url} target="_blank" rel="noreferrer" className="mb-1 block underline">
                          {item.content || "Attachment"}
                        </a>
                      ) : null}
                      {item.message_type === "text" || !item.attachment_url ? <p>{item.content}</p> : null}
                      <p className={`mt-1 text-[10px] ${mine ? "text-black/60" : "text-zinc-500"}`}>
                        {formatTime(item.created_at)}
                        {mine ? (othersRead ? " · Read" : " · Sent") : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <form onSubmit={onSend} className="flex items-end gap-2 border-t border-line px-3 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          className="btn-ghost h-11 px-3 text-sm"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
        >
          File
        </button>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          placeholder="Message"
          className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-axiom"
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary h-11 px-5 text-sm">
          Send
        </button>
      </form>
    </div>
  );
}
