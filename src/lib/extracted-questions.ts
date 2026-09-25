import type { AdminContent, ExtractedQuestion } from "@/lib/admin";
import { deskMatches, type DeskFilters } from "@/lib/desk-catalog";

export type PlayableQuestion = ExtractedQuestion & {
  set_id: string;
  title: string;
  subject: string | null;
  chapter: string | null;
  tier: string | null;
};

export function collectExtractedQuestions(contents: AdminContent[], filters: DeskFilters & { set?: string | null }) {
  const playable: PlayableQuestion[] = [];
  for (const item of contents) {
    if (item.extracted_kind !== "questions" || !item.extracted_questions?.length) continue;
    if (filters.set) {
      if (item.id !== filters.set && item.live_id !== filters.set) continue;
    } else if (!deskMatches(item, filters)) {
      continue;
    }
    for (const question of item.extracted_questions) {
      playable.push({
        ...question,
        set_id: item.id,
        title: item.title,
        subject: item.subject ?? null,
        chapter: item.chapter ?? null,
        tier: item.tier ?? null,
      });
    }
  }
  return playable;
}
