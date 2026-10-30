import { redirect } from "next/navigation";

export default async function DashboardMentorChatRedirect({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = await params;
  redirect(`/mentors/${mentorId}/chat`);
}
