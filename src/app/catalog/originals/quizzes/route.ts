import { NextResponse } from "next/server";
import { QUIZ_TIER_OPTIONS } from "@/lib/admin-destinations";
import { listDeskContents } from "@/lib/desk-contents";
import { filterDesk } from "@/lib/desk-catalog";
import { proxyLiveJson } from "@/lib/live-api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chapterId = url.searchParams.get("chapter_id");
  const live = await proxyLiveJson<{
    chapter_id?: string;
    tiers?: Array<{ key: string; name: string; purpose: string; default_limit: number; available_tests: number }>;
    named_quizzes?: Array<Record<string, unknown>>;
    community_banner?: { title: string; href: string };
  }>(req, `/api/originals/quizzes${url.search}`);

  const desk = filterDesk(await listDeskContents(), {
    destination: "originals-quizzes",
    chapter: chapterId,
    quizTier: url.searchParams.get("quiz_tier"),
  });

  const tiers = (live?.tiers || QUIZ_TIER_OPTIONS.map((tier) => ({
    key: tier.id,
    name: tier.label,
    purpose: "",
    default_limit: 25,
    available_tests: 0,
  }))).map((tier) => ({
    ...tier,
    available_tests: (tier.available_tests || 0) + desk.filter((item) => !item.quiz_tier || item.quiz_tier === tier.key).length,
  }));

  const named = [
    ...desk.map((item) => ({
      id: item.id,
      title: item.title,
      quiz_tier: item.quiz_tier,
      question_count: 1,
      duration_sec: 30 * 60,
    })),
    ...(live?.named_quizzes || []),
  ];

  return NextResponse.json({
    chapter_id: chapterId,
    tiers,
    named_quizzes: named,
    community_banner: live?.community_banner || { title: "Join the Axiom Prep Community", href: "/originals/community" },
    desk,
  });
}
