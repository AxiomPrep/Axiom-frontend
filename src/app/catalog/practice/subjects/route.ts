import { curriculumSubjects, mergeSubjects } from "@/lib/desk-catalog";
import { catalogResponse, proxyLiveJson } from "@/lib/live-api";

export const revalidate = 60;

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ subjects?: Array<Record<string, unknown>> }>(req, "/api/practice/subjects");
  const subjects = mergeSubjects(live?.subjects || [], curriculumSubjects());
  return catalogResponse({ subjects });
}
