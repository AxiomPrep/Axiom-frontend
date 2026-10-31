"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMeeting } from "@/lib/chat-api";
import { getRealtimeClient } from "@/lib/chat-realtime";
import { meetingWindow } from "@/lib/meeting-time";
import type { RealtimeChannel } from "@supabase/supabase-js";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

type SignalKind = "offer" | "answer" | "ice";

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="h-full w-full rounded-2xl bg-black object-cover" />;
}

export function MeetingRoom({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const localRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfId = useRef("");
  const [title, setTitle] = useState("Weekly meeting");
  const [when, setWhen] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remotes, setRemotes] = useState<Array<{ id: string; stream: MediaStream }>>([]);

  useEffect(() => {
    let dead = false;
    const connections = pcs.current;
    const queued = iceQueue.current;

    function send(to: string, kind: SignalKind, data: RTCSessionDescriptionInit | RTCIceCandidateInit) {
      void channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { from: selfId.current, to, kind, data },
      });
    }

    function flushIce(peerId: string, pc: RTCPeerConnection) {
      const waiting = queued.get(peerId) || [];
      queued.set(peerId, []);
      for (const candidate of waiting) {
        void pc.addIceCandidate(candidate).catch(() => undefined);
      }
    }

    function ensurePc(peerId: string) {
      const existing = connections.get(peerId);
      if (existing) return existing;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStream.current?.getTracks().forEach((track) => {
        if (localStream.current) pc.addTrack(track, localStream.current);
      });
      pc.onicecandidate = (event) => {
        if (event.candidate) send(peerId, "ice", event.candidate.toJSON());
      };
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        setRemotes((current) => [...current.filter((item) => item.id !== peerId), { id: peerId, stream }]);
        setStatus("Connected");
      };
      connections.set(peerId, pc);
      return pc;
    }

    async function call(peerId: string) {
      const pc = ensurePc(peerId);
      if (pc.signalingState !== "stable" || pc.currentLocalDescription) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send(peerId, "offer", offer);
    }

    async function onSignal(payload: { from?: string; to?: string; kind?: SignalKind; data?: RTCSessionDescriptionInit | RTCIceCandidateInit }) {
      const from = payload.from || "";
      if (!from || payload.to !== selfId.current || !payload.kind || !payload.data) return;
      if (payload.kind === "offer") {
        const pc = ensurePc(from);
        await pc.setRemoteDescription(payload.data as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send(from, "answer", answer);
        flushIce(from, pc);
        return;
      }
      if (payload.kind === "answer") {
        const pc = connections.get(from);
        if (!pc) return;
        await pc.setRemoteDescription(payload.data as RTCSessionDescriptionInit);
        flushIce(from, pc);
        return;
      }
      const pc = connections.get(from);
      if (!pc || !pc.remoteDescription) {
        const list = queued.get(from) || [];
        list.push(payload.data as RTCIceCandidateInit);
        queued.set(from, list);
        return;
      }
      await pc.addIceCandidate(payload.data as RTCIceCandidateInit).catch(() => undefined);
    }

    async function boot() {
      try {
        const detail = await getMeeting(meetingId);
        if (dead) return;
        selfId.current = detail.self_id;
        setTitle(detail.meeting.title);
        const windowInfo = meetingWindow(detail.meeting.weekday, detail.meeting.start_time, detail.meeting.duration_minutes);
        setWhen(windowInfo.label);
        if (!windowInfo.open) {
          setStatus(`Meeting not started. Scheduled time is ${windowInfo.label}.`);
          return;
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setCameraOff(true);
        }
        if (dead) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStream.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        const supabase = getRealtimeClient();
        if (!supabase) {
          setError("Sign in again to join this meeting.");
          return;
        }
        const channel = supabase.channel(`meeting:${meetingId}`, {
          config: { broadcast: { self: false }, presence: { key: detail.self_id } },
        });
        channelRef.current = channel;
        channel.on("broadcast", { event: "signal" }, ({ payload }) => {
          void onSignal(payload as { from?: string; to?: string; kind?: SignalKind; data?: RTCSessionDescriptionInit });
        });
        channel.on("presence", { event: "sync" }, () => {
          const ids = Object.keys(channel.presenceState()).filter((id) => id !== selfId.current);
          setStatus(ids.length ? "Connecting…" : "Waiting for the other person to join");
          for (const id of ids) {
            if (selfId.current < id) void call(id);
          }
          for (const id of [...connections.keys()]) {
            if (!ids.includes(id)) {
              connections.get(id)?.close();
              connections.delete(id);
              setRemotes((current) => current.filter((item) => item.id !== id));
            }
          }
        });
        channel.subscribe(async (state) => {
          if (state === "SUBSCRIBED") {
            await channel.track({ user_id: detail.self_id });
            setStatus("Waiting for the other person to join");
          }
        });
      } catch (err) {
        if (!dead) setError(err instanceof Error ? err.message : "Could not join the meeting");
      }
    }

    void boot();
    return () => {
      dead = true;
      localStream.current?.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      for (const pc of connections.values()) pc.close();
      connections.clear();
      const supabase = getRealtimeClient();
      if (channelRef.current && supabase) void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [meetingId]);

  function toggleMute() {
    setMuted((current) => {
      const next = !current;
      localStream.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }

  function toggleCamera() {
    setCameraOff((current) => {
      const next = !current;
      localStream.current?.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }

  function leave() {
    localStream.current?.getTracks().forEach((track) => track.stop());
    router.back();
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col rounded-[1.5rem] border border-line bg-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold text-ink">{title}</p>
          <p className="text-sm text-zinc-500">{when} · On Axiom, not an outside meeting app</p>
        </div>
        <button type="button" onClick={leave} className="btn-ghost h-10 px-4 text-sm">
          Leave
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : <p className="mb-3 text-sm text-zinc-400">{status}</p>}
      <div className="grid flex-1 gap-3 md:grid-cols-2">
        <div className="relative min-h-64 overflow-hidden rounded-2xl bg-black">
          <video ref={localRef} autoPlay muted playsInline className="h-full min-h-64 w-full object-cover" />
          <p className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white">You</p>
        </div>
        {remotes.length ? (
          remotes.map((remote) => (
            <div key={remote.id} className="relative min-h-64 overflow-hidden rounded-2xl bg-black">
              <RemoteVideo stream={remote.stream} />
            </div>
          ))
        ) : (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-zinc-500">
            The other person will appear here when they join.
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={toggleMute} className="btn-ghost h-11 px-4 text-sm">
          {muted ? "Unmute" : "Mute"}
        </button>
        <button type="button" onClick={toggleCamera} className="btn-ghost h-11 px-4 text-sm">
          {cameraOff ? "Camera off" : "Camera"}
        </button>
      </div>
    </div>
  );
}
