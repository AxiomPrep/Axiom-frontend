import { api } from "@/lib/api";
import { getApiOrigin, SUPABASE_ANON_KEY } from "@/lib/api-origin";
import { getAccessToken } from "@/lib/session";

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
  message_type: "text" | "image" | "file" | "audio" | "system";
  storage_path: string | null;
  attachment_url?: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
};

export type MentorMeeting = {
  id: string;
  conversation_id: string;
  host_id: string;
  title: string;
  weekday: number;
  start_time: string;
  duration_minutes: number;
  created_at: string;
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

export type MentorDesk = {
  mentor: {
    name: string;
    institute: string;
    role_label: string;
    exam_track: string;
    availability: "available" | "offline";
  };
  students: {
    conversation_id: string;
    name: string;
    preview: string;
    last_message_at: string | null;
    unread: boolean;
  }[];
  meetings: {
    id: string;
    conversation_id: string;
    title: string;
    weekday: number;
    start_time: string;
    duration_minutes: number;
    audience: string;
    with: string;
  }[];
};

export function getMentorDesk() {
  return api<MentorDesk>("/api/mentor/home");
}

export function setMentorAvailability(availability: "available" | "offline") {
  return api<{ availability: "available" | "offline" }>("/api/mentor/home", {
    method: "PATCH",
    body: JSON.stringify({ availability }),
  });
}

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
  body: { content?: string; message_type?: "text" | "image" | "file" | "audio"; storage_path?: string }
) {
  return api<{ message: ChatMessage }>(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteMessage(conversationId: string, messageId: string) {
  return api<{ ok: true; id: string; deleted_at: string }>(
    `/api/chat/conversations/${conversationId}/messages/${messageId}`,
    { method: "DELETE" }
  );
}

export function listMeetings(conversationId: string) {
  return api<{ meetings: MentorMeeting[] }>(`/api/chat/conversations/${conversationId}/meetings`);
}

export function createMeeting(
  conversationId: string,
  body: { title: string; weekday: number; start_time: string; duration_minutes: number }
) {
  return api<{ meeting: MentorMeeting }>(`/api/chat/conversations/${conversationId}/meetings`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getMeeting(meetingId: string) {
  return api<{ meeting: MentorMeeting; self_id: string }>(`/api/meetings/${meetingId}`);
}

export function markConversationRead(conversationId: string) {
  return api<{ ok: true }>(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
}

export function heartbeatPresence() {
  return api<{ ok: true }>("/api/chat/presence", { method: "POST" });
}

function uploadType(file: File, kind: "image" | "file" | "audio") {
  const raw = (file.type || "").split(";")[0].trim().toLowerCase();
  if (kind === "audio") {
    if (raw.includes("mp4") || raw.includes("m4a") || raw.includes("aac")) return "audio/mp4";
    if (raw.includes("mpeg") || raw.includes("mp3")) return "audio/mpeg";
    if (raw.includes("ogg")) return "audio/ogg";
    if (raw.includes("wav")) return "audio/wav";
    return "audio/webm";
  }
  if (kind === "image") {
    if (raw === "image/png" || raw === "image/webp" || raw === "image/gif") return raw;
    return "image/jpeg";
  }
  return raw || "application/pdf";
}

export async function uploadChatFile(conversationId: string, file: File, kind?: "image" | "file" | "audio") {
  const messageType = kind || (file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "file");
  const signed = await api<{ upload_url: string; storage_path: string }>(`/api/chat/attachments`, {
    method: "POST",
    body: JSON.stringify({ filename: file.name, conversation_id: conversationId }),
  });
  const put = await fetch(signed.upload_url, {
    method: "PUT",
    headers: { "Content-Type": uploadType(file, messageType) },
    body: file,
  });
  if (!put.ok) throw new Error("Could not upload the file");
  return sendMessage(conversationId, {
    content: messageType === "image" ? "Photo" : messageType === "audio" ? "Voice message" : file.name,
    message_type: messageType,
    storage_path: signed.storage_path,
  });
}

export async function fetchChatFile(conversationId: string, storagePath: string, signal?: AbortSignal) {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("apikey", SUPABASE_ANON_KEY);
  const res = await fetch(
    `${getApiOrigin()}/api/chat/conversations/${conversationId}/media?path=${encodeURIComponent(storagePath)}`,
    { headers, signal, credentials: "omit" }
  );
  if (!res.ok) throw new Error("Could not open the file");
  return res.blob();
}

export function listNotifications() {
  return api<{ notifications: Array<{ id: string; title: string; body: string; read_at: string | null; conversation_id?: string; created_at: string }>; unread_count: number }>(
    "/api/notifications?unread=true&limit=20"
  );
}
