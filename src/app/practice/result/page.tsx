'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAttemptResult } from '@/lib/study-api'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Sparkles,
  BarChart3,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Share2,
} from 'lucide-react'

interface QuestionResult {
  questionId: number
  questionText: string
  formula?: string
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  correctOption: 'A' | 'B' | 'C' | 'D'
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  isCorrect: boolean
  timeSpent: number
  solutionViewSeconds?: number
  explanation: string
  difficulty: string
}

interface StoredAttempt {
  attemptId?: string
  subjectName: string
  chapterName: string
  tierName: string
  totalQuestions: number
  timeTakenSeconds: number
  attempts: QuestionResult[]
  chapterBreakdown?: { topic: string; correct: number; total: number }[]
}

function ResultContent() {
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attempt') || ''
  const [data, setData] = useState<StoredAttempt | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem('axiom_last_attempt') : null
    let local: StoredAttempt | null = null
    if (localRaw) {
      try {
        local = JSON.parse(localRaw) as StoredAttempt
      } catch {
        local = null
      }
    }

    const load = async () => {
      if (attemptId) {
        const result = await getAttemptResult(attemptId)
        if (result?.questions.length) {
          return {
            attemptId,
            subjectName: local?.subjectName || 'Practice',
            chapterName: local?.chapterName || 'Chapter',
            tierName: local?.tierName || 'Set',
            totalQuestions: result.questions.length,
            timeTakenSeconds: result.timeTakenSeconds || local?.timeTakenSeconds || 0,
            attempts: result.questions,
            chapterBreakdown: result.chapterBreakdown,
          } satisfies StoredAttempt
        }
      }
      if (local && (!attemptId || !local.attemptId || local.attemptId === attemptId)) {
        return local
      }
      throw new Error('No result is available for this attempt.')
    }

    load()
      .then((next) => {
        if (!active) return
        setData(next)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setData(null)
        setError(err instanceof Error ? err.message : 'Could not load this result.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [attemptId])

  if (loading) {
    return <div className="px-4 py-16 text-center text-sm text-muted">Loading result from the Axiom Prep API…</div>
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-ink">No result yet</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
        <Link href="/practice" className="btn-primary mt-6 inline-flex h-10 items-center px-4 text-sm">
          Back to practice
        </Link>
      </div>
    )
  }

  const attemptData = data
  const correctCount = attemptData.attempts.filter((a) => a.isCorrect).length
  const wrongCount = attemptData.attempts.filter((a) => a.selectedOption && !a.isCorrect).length
  const rawScore = correctCount * 4 - wrongCount * 1
  const maxScore = attemptData.attempts.length * 4
  const accuracy = Math.round((correctCount / (correctCount + wrongCount || 1)) * 100)
  const avgTimePerQ = Math.round(attemptData.timeTakenSeconds / attemptData.attempts.length)

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `I just scored ${rawScore}/${maxScore} with ${accuracy}% accuracy on Axiom Prep (${attemptData.chapterName})! Check it out at https://axiom.app`
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="text-ink py-12 px-4 sm:px-6">
      <div className="relative mx-auto max-w-5xl">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-axiom/10 blur-[130px]"></div>

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-axiom">
              <Trophy className="h-3.5 w-3.5" />
              <span>PRACTICE DIAGNOSTIC COMPLETE</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Performance Scorecard
            </h1>
            <p className="text-xs text-muted mt-1">
              {attemptData.subjectName} • {attemptData.chapterName} • {attemptData.tierName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-bold text-ink hover:bg-card-hover transition"
            >
              <Share2 className="h-3.5 w-3.5 text-axiom" />
              <span>{copied ? 'Link Copied!' : 'Share Score'}</span>
            </button>
            <Link
              href="/practice"
              className="rounded-xl bg-axiom px-4 py-2 text-xs font-bold text-black shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition"
            >
              Practice Another Chapter
            </Link>
          </div>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Score */}
          <div className="rounded-2xl border border-axiom/30 bg-linear-to-b from-axiom/10 to-card p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-axiom font-bold mb-2">
              <span>SCORE</span>
              <Trophy className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold text-ink">
              {rawScore}{' '}
              <span className="text-xs text-muted font-medium">/ {maxScore}</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
              +{correctCount * 4} Marks / -{wrongCount} Penalty
            </div>
          </div>

          {/* Accuracy */}
          <div className="rounded-2xl border border-emerald-500/20 bg-card/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-2">
              <span>ACCURACY</span>
              <Target className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold text-emerald-400">{accuracy}%</div>
            <div className="mt-2 text-[11px] text-muted">
              {correctCount} Correct • {wrongCount} Incorrect
            </div>
          </div>

          {/* Speed / Pace */}
          <div className="rounded-2xl border border-line bg-card/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-axiom font-bold mb-2">
              <span>AVG SPEED</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold text-ink">{avgTimePerQ}s</div>
            <div className="mt-2 text-[11px] text-muted">
              Total {Math.round(attemptData.timeTakenSeconds / 60)}m {attemptData.timeTakenSeconds % 60}s
            </div>
          </div>

          {/* Estimated Percentile */}
          <div className="rounded-2xl border border-orange-500/20 bg-card/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-orange-400 font-bold mb-2">
              <span>PERCENTILE EST.</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold text-orange-400">{accuracy}%</div>
            <div className="mt-2 text-[11px] text-muted">Accuracy used as a local estimate</div>
          </div>
        </div>

        {/* Chapter Breakdown Card */}
        <div className="rounded-3xl border border-line bg-card/60 p-6 sm:p-8 backdrop-blur-xl mb-10">
          <div className="flex items-center justify-between border-b border-line/60 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-axiom" />
              <h2 className="text-lg font-bold text-ink">Chapter &amp; Topic Diagnostic</h2>
            </div>
            <span className="text-xs text-axiom font-semibold">High Mastery Status</span>
          </div>

          <div className="space-y-4">
            {(attemptData.chapterBreakdown?.length
              ? attemptData.chapterBreakdown
              : [{ topic: attemptData.chapterName, correct: correctCount, total: attemptData.attempts.length }]
            ).map((row) => {
              const pct = row.total ? Math.round((row.correct / row.total) * 100) : 0
              return (
                <div key={row.topic}>
                  <div className="flex justify-between text-xs font-semibold text-ink mb-1.5">
                    <span>{row.topic}</span>
                    <span className={pct >= 80 ? 'text-emerald-400' : 'text-axiom'}>
                      {pct}% ({row.correct}/{row.total} Correct)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-card-hover overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : 'bg-axiom'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-ink">Detailed Solution Review</h3>
              <p className="text-xs text-muted mt-0.5">
                Step-by-step mathematical reasoning &amp; error analysis
              </p>
            </div>
            <div className="text-xs text-muted">
              {attemptData.attempts.length} Questions Reviewed
            </div>
          </div>

          {attemptData.attempts.map((attempt, idx) => (
            <div
              key={attempt.questionId}
              className={`rounded-2xl border p-6 backdrop-blur-xl transition ${
                attempt.isCorrect
                  ? 'border-emerald-500/30 bg-card/50'
                  : 'border-rose-500/30 bg-rose-950/10'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-card-hover px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
                    Q{idx + 1}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    Difficulty: {attempt.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono text-xs text-muted">
                    <Clock className="h-3 w-3 text-axiom" />
                    {attempt.timeSpent}s spent
                    {typeof attempt.solutionViewSeconds === 'number' && (
                      <span className="ml-1.5 text-axiom/80">• {attempt.solutionViewSeconds}s solution</span>
                    )}
                  </span>
                  {attempt.isCorrect ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Correct (+4)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                      <XCircle className="h-3.5 w-3.5" />
                      {attempt.selectedOption ? 'Incorrect (-1)' : 'Unattempted (0)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <p className="text-sm sm:text-base font-medium text-ink mb-4 leading-relaxed">
                {attempt.questionText}
              </p>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {attempt.options.map((opt) => {
                  const isCorrect = opt.id === attempt.correctOption
                  const isUserChosen = opt.id === attempt.selectedOption

                  let optClass = 'border-line/60 bg-card/60 text-muted'
                  if (isCorrect) {
                    optClass = 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold'
                  } else if (isUserChosen && !isCorrect) {
                    optClass = 'border-rose-500 bg-rose-950/30 text-rose-300 font-semibold'
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${optClass}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono font-bold">
                        {opt.id}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                      {isUserChosen && !isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* AI Step-by-Step Solution */}
              <div className="rounded-xl border border-axiom/20 bg-axiom/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-axiom mb-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Axiom Prep Step-by-Step AI Solution</span>
                </div>
                <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                  {attempt.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line pt-6">
          <Link
            href="/practice"
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-5 py-3 text-xs font-bold text-ink hover:bg-card-hover transition"
          >
            <RotateCcw className="h-4 w-4 text-axiom" />
            <span>Retake This Chapter Practice</span>
          </Link>

          <Link
            href="/pyq-bank"
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-[#e8c07a] to-axiom px-6 py-3 text-xs font-semibold text-black shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition"
          >
            <BookOpen className="h-4 w-4" />
            <span>Explore PYQ Exam Sets</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AttemptResultPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-muted">Loading result…</div>}>
      <ResultContent />
    </Suspense>
  )
}
