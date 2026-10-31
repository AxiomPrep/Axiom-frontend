"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteMessage,
  fetchChatFile,
  getConversation,
  getMeeting,
  listMessages,
  markConversationRead,
  sendMessage,
  uploadChatFile,
  type ChatMessage,
} from "@/lib/chat-api";
import { containsPhoneNumber } from "@/lib/chat-guard";
import { meetingWindow, parseMeetingMessage } from "@/lib/meeting-time";
import { ChatMeetings } from "@/components/chat/ChatMeetings";
import { enableBrowserNotifications, pingBrowserNotification, publishMessageDeleted, subscribeConversation } from "@/lib/chat-realtime";
import { BrandLoader } from "@/components/BrandLoader";

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function useChatBlob(conversationId: string, storagePath: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!storagePath) return;
    let dead = false;
    let revoke = "";
    const controller = new AbortController();
    setSrc(null);
    setFailed(false);
    fetchChatFile(conversationId, storagePath, controller.signal)
      .then((blob) => {
        if (dead) return;
        revoke = URL.createObjectURL(blob);
        setSrc(revoke);
      })
      .catch((err: unknown) => {
        if (dead || (err instanceof DOMException && err.name === "AbortError")) return;
        setFailed(true);
      });
    return () => {
      dead = true;
      controller.abort();
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [conversationId, storagePath]);

  return { src, failed };
}

function ChatImage({
  conversationId,
  item,
}: {
  conversationId: string;
  item: ChatMessage;
}) {
  const { src, failed } = useChatBlob(conversationId, item.storage_path);
  const [broken, setBroken] = useState(false);
  const preview = src || (failed ? item.attachment_url : null) || null;
  const openHref = src || item.attachment_url || "";

  if (!src && !failed) return <p className="text-xs opacity-70">Loading photo…</p>;

  if (!preview || broken) {
    return openHref ? (
      <a href={openHref} target="_blank" rel="noreferrer" className="mb-1 block underline">
        Open photo
      </a>
    ) : (
      <p>Photo</p>
    );
  }

  return (
    <a href={openHref} target="_blank" rel="noreferrer" className="mb-1 block" onClick={(event) => event.stopPropagation()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt="Photo"
        className="max-h-64 max-w-full rounded-xl object-contain"
        onError={() => setBroken(true)}
      />
    </a>
  );
}

function ChatAudio({
  conversationId,
  item,
}: {
  conversationId: string;
  item: ChatMessage;
}) {
  const { src, failed } = useChatBlob(conversationId, item.storage_path);
  const playable = src || (failed ? item.attachment_url : null);
  if (!src && !failed) return <p className="text-xs opacity-70">Loading voice message…</p>;
  if (!playable) return <p>Voice message</p>;
  return <audio controls src={playable} className="mb-1 h-10 w-56 max-w-full" preload="metadata" />;
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
  const [recording, setRecording] = useState(false);
  const [role, setRole] = useState("student");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<Record<string, string>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);

  function merge(next: ChatMessage) {
    setMessages((current) => {
      if (current.some((row) => row.id === next.id)) return current;
      return [...current, next].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state === "recording") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const [detail, history] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
        if (!alive) return;
        const viewingAsMentor =
          detail.membership.member_role === "mentor" || detail.membership.member_role === "admin";
        const studentName =
          detail.peer && detail.peer.id !== me ? detail.peer.full_name || "Student" : "Student";
        setTitle(
          viewingAsMentor ? studentName : detail.mentor?.full_name || detail.conversation.title || "Mentor"
        );
        setSubtitle(
          detail.conversation.kind === "community"
            ? "Group discussion"
            : detail.conversation.kind === "announcements"
              ? "Announcements"
              : viewingAsMentor
                ? "Student"
                : detail.mentor?.institute || "Private chat"
        );
        const reads: Record<string, string> = {};
        for (const member of detail.members) {
          if (member.last_read_at) reads[member.user_id] = member.last_read_at;
        }
        setReadAt(reads);
        setRole(detail.membership.member_role || "student");
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
    const unsubscribe = subscribeConversation(
      conversationId,
      (incoming) => {
        if (incoming.deleted_at) {
          setMessages((current) => current.filter((row) => row.id !== incoming.id));
          return;
        }
        merge(incoming);
        if (incoming.sender_id !== me) {
          pingBrowserNotification("Axiom Prep", incoming.content || "New message");
          void markConversationRead(conversationId);
        }
      },
      (messageId) => {
        setMessages((current) => current.filter((row) => row.id !== messageId));
      }
    );
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
    if (containsPhoneNumber(content)) {
      setError("Phone numbers can't be shared in mentor chat.");
      return;
    }
    setSending(true);
    setText("");
    setError(null);
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

  function toggleSelected(item: ChatMessage) {
    if (item.sender_id !== me) return;
    setSelected((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]));
  }

  async function deleteSelected() {
    const ids = selected.filter((id) => messages.some((item) => item.id === id && item.sender_id === me));
    if (!ids.length) return;
    setSelected([]);
    setMessages((current) => current.filter((row) => !ids.includes(row.id)));
    try {
      await Promise.all(
        ids.map(async (id) => {
          await deleteMessage(conversationId, id);
          publishMessageDeleted(conversationId, id);
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the message");
      const history = await listMessages(conversationId).catch(() => null);
      if (history) setMessages(history.messages);
    }
  }

  async function reloadMessages() {
    const history = await listMessages(conversationId).catch(() => null);
    if (history) setMessages(history.messages);
  }

  async function onFile(file: File | undefined, kind?: "image" | "file" | "audio") {
    if (!file) return;
    if (containsPhoneNumber(file.name)) {
      setError("Phone numbers can't be shared in mentor chat.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await uploadChatFile(conversationId, file, kind);
      merge(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send file");
    } finally {
      setSending(false);
    }
  }

  async function toggleVoice() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      return;
    }
    if (sending) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice messages are not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        if (aliveRef.current) setRecording(false);
        const type = (rec.mimeType || mime || "audio/webm").split(";")[0] || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
        const blob = new Blob(chunks, { type });
        if (!blob.size || !aliveRef.current) return;
        void onFile(new File([blob], `voice.${ext}`, { type }), "audio");
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setError(null);
    } catch {
      setError("Allow the microphone to send a voice message.");
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
    <div className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-[1.5rem] border border-line bg-card">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <Link href={backHref} className="text-sm text-axiom hover:text-axiom-hover">
          Back
        </Link>
        <div className="min-w-0 flex-1">
          {selected.length ? (
            <p className="font-display text-xl font-semibold text-ink">{selected.length} selected</p>
          ) : (
            <>
              <p className="truncate font-display text-xl font-semibold text-ink">{title}</p>
              <p className="truncate text-xs text-zinc-500">{subtitle}</p>
            </>
          )}
        </div>
        {selected.length ? (
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm text-zinc-400" onClick={() => setSelected([])}>
              Cancel
            </button>
            <button type="button" className="btn-primary h-9 px-3 text-sm" onClick={() => void deleteSelected()}>
              Delete
            </button>
          </div>
        ) : null}
      </header>
      <ChatMeetings conversationId={conversationId} memberRole={role} onCreated={() => void reloadMessages()} />
      {error ? <p className="shrink-0 px-4 py-2 text-sm text-red-300">{error}</p> : null}
      <div ref={scroller} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
        {days.map((group) => (
          <section key={group.day}>
            <p className="mb-3 text-center text-[11px] tracking-[0.14em] text-zinc-500">{group.day}</p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const mine = item.sender_id === me;
                const meeting = parseMeetingMessage(item.content);
                const chosen = selected.includes(item.id);
                const othersRead = Object.entries(readAt).some(
                  ([userId, at]) => userId !== me && at >= item.created_at
                );
                return (
                  <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      onClick={() => toggleSelected(item)}
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mine ? "cursor-pointer bg-axiom text-black" : "bg-white/5 text-ink"
                      } ${chosen ? "ring-2 ring-white" : ""}`}
                    >
                      {item.message_type === "image" && item.storage_path ? (
                        <ChatImage conversationId={conversationId} item={item} />
                      ) : null}
                      {item.message_type === "audio" && item.storage_path ? (
                        <ChatAudio conversationId={conversationId} item={item} />
                      ) : null}
                      {item.message_type === "file" && item.attachment_url ? (
                        <a href={item.attachment_url} target="_blank" rel="noreferrer" className="mb-1 block underline" onClick={(event) => event.stopPropagation()}>
                          {item.content || "Attachment"}
                        </a>
                      ) : null}
                      {item.message_type === "file" && !item.attachment_url && item.storage_path ? (
                        <FileFallback conversationId={conversationId} item={item} />
                      ) : null}
                      {meeting ? (
                        <MeetingNote meetingId={meeting.id} text={meeting.text} />
                      ) : item.message_type === "text" || item.message_type === "system" ? (
                        <p className="whitespace-pre-wrap break-words">{item.content}</p>
                      ) : null}
                      <p className={`mt-1 text-[11px] ${mine ? "text-black/70" : "text-zinc-400"}`}>
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
      <form onSubmit={onSend} className="flex shrink-0 items-end gap-2 border-t border-line px-3 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            const kind = file?.type.startsWith("image/") ? "image" : "file";
            void onFile(file, kind);
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          className="btn-ghost h-11 px-3 text-sm"
          onClick={() => fileRef.current?.click()}
          disabled={sending || recording}
        >
          File
        </button>
        <button
          type="button"
          className={`h-11 rounded-full px-3 text-sm ${recording ? "bg-red-500 text-white" : "btn-ghost"}`}
          onClick={() => void toggleVoice()}
          disabled={sending && !recording}
        >
          {recording ? "Stop" : "Voice"}
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
          placeholder={recording ? "Recording voice message…" : "Message"}
          className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-axiom"
        />
        <button type="submit" disabled={sending || recording || !text.trim()} className="btn-primary h-11 px-5 text-sm">
          Send
        </button>
      </form>
    </div>
  );
}

function MeetingNote({ meetingId, text }: { meetingId: string; text: string }) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  async function join(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setNote(null);
    try {
      const detail = await getMeeting(meetingId);
      const windowInfo = meetingWindow(detail.meeting.weekday, detail.meeting.start_time, detail.meeting.duration_minutes);
      if (!windowInfo.open) {
        setNote(`Meeting not started. Scheduled time is ${windowInfo.label}.`);
        return;
      }
      router.push(`/meet/${meetingId}`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not open the meeting");
    }
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <p className="whitespace-pre-wrap break-words">{text}</p>
      <button type="button" onClick={(event) => void join(event)} className="mt-2 underline">
        Join
      </button>
      {note ? <p className="mt-1 text-xs">{note}</p> : null}
    </div>
  );
}

function FileFallback({ conversationId, item }: { conversationId: string; item: ChatMessage }) {
  const { src } = useChatBlob(conversationId, item.storage_path);
  if (!src) return <p>{item.content || "Attachment"}</p>;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="mb-1 block underline">
      {item.content || "Attachment"}
    </a>
  );
}
