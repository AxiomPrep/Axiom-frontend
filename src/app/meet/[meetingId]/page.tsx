"use client";

import { useParams } from "next/navigation";
import { Shell } from "@/components/ui";
import { MeetingRoom } from "@/components/meet/MeetingRoom";

export default function MeetPage() {
  const params = useParams<{ meetingId: string }>();
  return (
    <Shell>
      <MeetingRoom meetingId={params.meetingId} />
    </Shell>
  );
}
