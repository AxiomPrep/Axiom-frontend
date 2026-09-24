"use client";

import { useEffect, useState } from "react";
import { getCoins, getLeaderboard, type CoinWallet, type LeaderboardEntry } from "@/lib/study-api";
import { LoadingBlock, PageHeader, Shell } from "@/components/ui";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getLeaderboard(), getCoins()])
      .then(([lb, coins]) => {
        if (!active) return;
        setEntries(Array.isArray(lb) ? lb : []);
        setWallet(coins ?? { gold: 0, silver: 0 });
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setWallet({ gold: 0, silver: 0 });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podium = [top3[1], top3[0], top3[2]];

  return (
    <Shell>
      <PageHeader
        eyebrow="Axiom Prep rankings"
        title="Gold and silver leaderboard."
        subtitle="Ranked by gold coins first, then silver. Your wallet sits with the cohort."
      />
      <div className="mb-8 flex flex-wrap gap-3">
        <div className="surface rounded-2xl px-5 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-axiom">Gold</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{(wallet?.gold ?? 0).toLocaleString()}</p>
        </div>
        <div className="surface rounded-2xl px-5 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Silver</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">{(wallet?.silver ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Loading rankings…" />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-3 items-end gap-3">
            {podium.map((entry, idx) => {
              if (!entry) return <div key={`empty-${idx}`} />;
              const first = entry.rank === 1;
              return (
                <article
                  key={entry.rank}
                  className={`surface rounded-2xl p-4 text-center ${first ? "ring-2 ring-axiom sm:py-8" : "sm:py-6"}`}
                >
                  <p className="font-display text-sm italic text-axiom">#{entry.rank}</p>
                  <h2 className="mt-2 truncate font-display text-lg font-semibold text-ink sm:text-xl">{entry.name}</h2>
                  <p className="text-xs text-muted">{entry.subject}</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    <span className="text-axiom">{entry.gold.toLocaleString()} gold</span>
                    <span className="mx-1.5 text-zinc-600">/</span>
                    {entry.silver.toLocaleString()} silver
                  </p>
                </article>
              );
            })}
          </div>

          <div className="surface overflow-hidden rounded-2xl">
            <div className="grid grid-cols-12 gap-2 border-b border-line px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              <span className="col-span-2">Rank</span>
              <span className="col-span-4">Student</span>
              <span className="col-span-3 text-right">Gold</span>
              <span className="col-span-3 text-right">Silver</span>
            </div>
            {rest.map((entry) => (
              <div key={entry.rank} className="grid grid-cols-12 items-center gap-2 border-b border-line/60 px-5 py-3.5 text-sm last:border-0">
                <span className="col-span-2 text-muted">#{entry.rank}</span>
                <span className="col-span-4">
                  <span className="font-medium text-ink">{entry.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">{entry.subject}</span>
                </span>
                <span className="col-span-3 text-right text-axiom">{entry.gold.toLocaleString()}</span>
                <span className="col-span-3 text-right text-muted">{entry.silver.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
