import { catalogResponse, proxyLiveJson } from "@/lib/live-api";

export const revalidate = 60;

export async function GET(req: Request) {
  const live = await proxyLiveJson<{ plans?: Array<Record<string, unknown>> }>(req, "/api/plans");
  return catalogResponse({ plans: live?.plans || [] });
}
