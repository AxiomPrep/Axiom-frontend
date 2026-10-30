import { api } from "@/lib/api";

export type ChatAccess = {
  ok: boolean;
  tier: "a" | "b" | null;
  track: "jee" | "neet" | "both" | null;
  endsAt: string | null;
};

export type MentorCard = {
  id: string;
  slug: string;
  full_name: string;
  role_label: string | null;
  institute: string | null;
  exam_track: "jee" | "neet" | "both";
  subjects: string[];
  highlights: string[];
  required_tier: "a" | "b";
  availability: "available" | "offline";
  last_seen_at: string | null;
  online: boolean;
  allowed: boolean;
  locked_reason: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "file" | "system";
  storage_path: string | null;
  attachment_url?: string | null;
  created_at: string;
  edited_at?: string | null;
};

export type ChatConversation = {
  id: string;
  type: "direct" | "group";
  kind: "direct" | "community" | "announcements";
  title: string | null;
  mentor_profile_id: string | null;
  created_for_user_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  member_role?: "student" | "mentor" | "admin";
  unread?: number;
  peer_name?: string | null;
  online?: boolean;
  mentor?: {
    id: string;
    slug: string;
    full_name: string;
    institute: string | null;
    exam_track: string;
    subjects: string[];
    last_seen_at: string | null;
    availability: string;
    user_id: string | null;
  } | null;
};

export function listMentors() {
  return api<{ access: ChatAccess; is_mentor: boolean; mentors: MentorCard[] }>("/api/mentors");
}

export function openMentorChat(mentorId: string, kind: "direct" | "community" | "announcements" = "direct") {
  return api<{ conversation_id: string; mentor: MentorCard; kind: string }>(`/api/mentors/${mentorId}/chat`, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export function listConversations(claim = false) {
  return api<{ conversations: ChatConversation[]; unread_total: number }>(
    `/api/chat/conversations${claim ? "?claim=1" : ""}`
  );
}

export function getConversation(id: string) {
  return api<{
    conversation: ChatConversation;
    membership: { member_role: string; last_read_at: string | null };
    mentor: MentorCard | null;
    peer: { id: string; full_name: string | null; email: string | null } | null;
    members: { user_id: string; member_role: string; last_read_at: string | null }[];
  }>(`/api/chat/conversations/${id}`);
}

export function listMessages(conversationId: string, before?: string) {
  const q = before ? `?before=${encodeURIComponent(before)}` : "";
  return api<{ messages: ChatMessage[] }>(`/api/chat/conversations/${conversationId}/messages${q}`);
}

export function sendMessage(
  conversationId: string,
  body: { content?: string; message_type?: "text" | "image" | "file"; storage_path?: string }
) {
  return api<{ message: ChatMessage }>(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function markConversationRead(conversationId: string) {
  return api<{ ok: true }>(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
}

export function heartbeatPresence() {
  return api<{ ok: true }>("/api/chat/presence", { method: "POST" });
}

export async function uploadChatFile(conversationId: string, file: File) {
  const signed = await api<{ upload_url: string; storage_path: string }>(`/api/chat/attachments`, {
    method: "POST",
    body: JSON.stringify({ filename: file.name, conversation_id: conversationId }),
  });
  const put = await fetch(signed.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Could not upload the file");
  return sendMessage(conversationId, {
    content: file.name,
    message_type: file.type.startsWith("image/") ? "image" : "file",
    storage_path: signed.storage_path,
  });
}

export function listNotifications() {
  return api<{ notifications: Array<{ id: string; title: string; body: string; read_at: string | null; conversation_id?: string; created_at: string }>; unread_count: number }>(
    "/api/notifications?unread=true&limit=20"
  );
}
