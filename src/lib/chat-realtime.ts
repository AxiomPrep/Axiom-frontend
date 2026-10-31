import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { getAccessToken } from "@/lib/session";
import { SUPABASE_ANON_KEY } from "@/lib/api-origin";
import type { ChatMessage } from "@/lib/chat-api";

const SUPABASE_URL = "https://afkjjeskssmtnzvmnkoe.supabase.co";

let client: SupabaseClient | null = null;

export function getRealtimeClient() {
  const token = getAccessToken();
  if (!token) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  void client.realtime.setAuth(token);
  return client;
}

const chatChannels = new Map<string, RealtimeChannel>();

export function subscribeConversation(
  conversationId: string,
  onMessage: (message: ChatMessage) => void,
  onDelete?: (messageId: string) => void
) {
  const supabase = getRealtimeClient();
  if (!supabase) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`chat:${conversationId}`, { config: { broadcast: { self: false } } })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const row = payload.new as ChatMessage;
        if (row?.deleted_at) onDelete?.(row.id);
      }
    )
    .on("broadcast", { event: "deleted" }, ({ payload }) => {
      const id = typeof payload?.id === "string" ? payload.id : "";
      if (id) onDelete?.(id);
    })
    .subscribe();
  chatChannels.set(conversationId, channel);
  return () => {
    chatChannels.delete(conversationId);
    void supabase.removeChannel(channel);
  };
}

export function publishMessageDeleted(conversationId: string, messageId: string) {
  const channel = chatChannels.get(conversationId);
  void channel?.send({ type: "broadcast", event: "deleted", payload: { id: messageId } });
}

export function subscribeNotifications(userId: string, onNotify: (row: Record<string, unknown>) => void) {
  const supabase = getRealtimeClient();
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel(`notices:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onNotify(payload.new as Record<string, unknown>)
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function enableBrowserNotifications() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function pingBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    new Notification(title, { body, icon: "/logo.png" });
  } catch {
    /* ignore */
  }
}
