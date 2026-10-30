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

export function resetRealtimeClient() {
  client?.removeAllChannels();
  client = null;
}

export function subscribeConversation(
  conversationId: string,
  onMessage: (message: ChatMessage) => void
) {
  const supabase = getRealtimeClient();
  if (!supabase) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
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
