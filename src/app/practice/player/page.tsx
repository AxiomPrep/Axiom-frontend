'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Question } from '@/data/mockCurriculum'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Send,
  Pause,
  Play,
  HelpCircle,
  X,
  Lightbulb,
} from 'lucide-react'
import {
  createPracticeAttempt,
  answerAttempt,
  submitAttempt,
} from '@/lib/study-api'

type QuestionStatus = 'answered' | 'marked' | 'marked-answered' | 'unanswered' | 'not-visited'

interface UserAttempt {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  isMarked: boolean
  timeSpentSeconds: number
  visited: boolean
  revealed: boolean
  solutionViewSeconds: number
}

function PlayerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const subjectId = searchParams.get('subject') || ''
  const chapterId = searchParams.get('chapter') || ''
  const classLevel = (searchParams.get('class') === '12' ? '12' : '11') as '11' | '12'
  const existingAttempt = searchParams.get('attempt')
  const tierNum = parseInt(searchParams.get('tier') || '1', 10)
  const subjectName = searchParams.get('subjectName') || subjectId || 'Practice'
  const chapterName = searchParams.get('chapterName') || chapterId || 'Chapter'
  const tierName = searchParams.get('tierName') || `Tier ${tierNum}`

  const [questions, setQuestions] = useState<Question[]>([])
  const [questionError, setQuestionError] = useState<string | null>(null)

  useEffect(() => {
    const query = new URLSearchParams({
      subject: subjectId,
      chapter_id: chapterId,
      tier: String(tierNum),
    })
    void api<{ questions?: Array<Record<string, unknown>> }>(`/api/questions?${query}`)
      .then((data) => {
        const list = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : data.questions || []
        setQuestions(list.map((item, index) => mapApiQuestion(item, index, subjectId, chapterId, tierNum)))
        setQuestionError(list.length ? null : 'No questions were returned for this set.')
      })
      .catch((err: unknown) => {
        setQuestions([])
        setQuestionError(err instanceof Error ? err.message : 'Could not load questions.')
      })
  }, [subjectId, chapterId, tierNum])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [attempts, setAttempts] = useState<Record<number, UserAttempt>>({
    0: { selectedOption: null, isMarked: false, timeSpentSeconds: 0, visited: true, revealed: false, solutionViewSeconds: 0 },
    1: { selectedOption: null, isMarked: false, timeSpentSeconds: 0, visited: false, revealed: false, solutionViewSeconds: 0 },
    2: { selectedOption: null, isMarked: false, timeSpentSeconds: 0, visited: false, revealed: false, solutionViewSeconds: 0 },
    3: { selectedOption: null, isMarked: false, timeSpentSeconds: 0, visited: false, revealed: false, solutionViewSeconds: 0 },
    4: { selectedOption: null, isMarked: false, timeSpentSeconds: 0, visited: false, revealed: false, solutionViewSeconds: 0 },
  })

  // Global Timer (15 minutes = 900 seconds)
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(900)
  const [isPaused, setIsPaused] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Create a persisted attempt record (mirrors POST /api/practice/attempt)
  useEffect(() => {
    if (existingAttempt) {
      setAttemptId(existingAttempt)
      return
    }
    let active = true
    createPracticeAttempt({
      subjectId,
      classLevel,
      chapterId,
      tierId: tierNum,
      totalSeconds: 900,
    })
      .then((attempt) => {
        if (active) setAttemptId(attempt.id)
      })
      .catch((err: unknown) => {
        if (active) setQuestionError(err instanceof Error ? err.message : 'Could not create an attempt.')
      })
    return () => {
      active = false
    }
  }, [existingAttempt, subjectId, classLevel, chapterId, tierNum])

  // Timer Tick
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      setTotalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmitTest()
          return 0
        }
        return prev - 1
      })

      // Track time on current question (+ solution-view time if revealed)
      setAttempts((prev) => ({
        ...prev,
        [currentIndex]: {
          ...prev[currentIndex],
          timeSpentSeconds: (prev[currentIndex]?.timeSpentSeconds || 0) + 1,
          solutionViewSeconds: prev[currentIndex]?.revealed
            ? (prev[currentIndex]?.solutionViewSeconds || 0) + 1
            : prev[currentIndex]?.solutionViewSeconds || 0,
        },
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, isPaused])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  const currentQ = questions[currentIndex]
  const currentAttempt = attempts[currentIndex] || {
    selectedOption: null,
    isMarked: false,
    timeSpentSeconds: 0,
    visited: true,
    revealed: false,
    solutionViewSeconds: 0,
  }

  const handleSelectOption = (optId: 'A' | 'B' | 'C' | 'D') => {
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        selectedOption: prev[currentIndex]?.selectedOption === optId ? null : optId,
        visited: true,
        revealed: false,
      },
    }))
  }

  // Locks the answer, reveals the solution, and starts solution-view timing.
  const handleSubmitAnswer = () => {
    if (currentAttempt.selectedOption === null) return
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        revealed: true,
        visited: true,
      },
    }))
    // Persist the answer (mirrors POST /api/attempts/:id/answer)
    if (attemptId) {
      answerAttempt(attemptId, {
        questionId: currentQ.id,
        selectedOption: currentAttempt.selectedOption,
        timeSpentSeconds: currentAttempt.timeSpentSeconds,
        solutionViewSeconds: currentAttempt.solutionViewSeconds,
      })
    }
  }

  const handleClearResponse = () => {
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        selectedOption: null,
      },
    }))
  }

  const handleToggleMark = () => {
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        isMarked: !prev[currentIndex]?.isMarked,
      },
    }))
  }

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1
      setAttempts((prev) => ({
        ...prev,
        [nextIdx]: {
          ...(prev[nextIdx] || { selectedOption: null, isMarked: false, timeSpentSeconds: 0, revealed: false, solutionViewSeconds: 0 }),
          visited: true,
        },
      }))
      setCurrentIndex(nextIdx)
    } else {
      setShowSubmitModal(true)
    }
  }

  const handleMarkAndNext = () => {
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        isMarked: true,
      },
    }))
    handleSaveAndNext()
  }

  const handleJumpToQuestion = (index: number) => {
    setAttempts((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || { selectedOption: null, isMarked: false, timeSpentSeconds: 0, revealed: false, solutionViewSeconds: 0 }),
        visited: true,
      },
    }))
    setCurrentIndex(index)
  }

  const getQuestionStatus = (idx: number): QuestionStatus => {
    const att = attempts[idx]
    if (!att || !att.visited) return 'not-visited'
    if (att.isMarked && att.selectedOption) return 'marked-answered'
    if (att.isMarked) return 'marked'
    if (att.selectedOption) return 'answered'
    return 'unanswered'
  }

  // Summary counts
  const answeredCount = Object.values(attempts).filter((a) => a.selectedOption).length
  const markedCount = Object.values(attempts).filter((a) => a.isMarked).length
  const unattemptedCount = questions.length - answeredCount

  const handleSubmitTest = async () => {
    if (submitting) return
    setSubmitting(true)
    const timeTaken = 900 - totalSecondsLeft
    // Save attempt in localStorage for Results page
    if (typeof window !== 'undefined') {
      const resultPayload = {
        attemptId,
        subjectName,
        chapterName,
        tierName,
        totalQuestions: questions.length,
        timeTakenSeconds: timeTaken,
        attempts: Object.entries(attempts).map(([idxStr, att]) => {
          const idx = parseInt(idxStr, 10)
          const q = questions[idx]
          return {
            questionId: q.id,
            questionText: q.question,
            formula: q.formula,
            options: q.options,
            correctOption: q.correctOption,
            selectedOption: att.selectedOption,
            isCorrect: att.selectedOption === q.correctOption,
            timeSpent: att.timeSpentSeconds,
            solutionViewSeconds: att.solutionViewSeconds,
            explanation: q.explanation,
            difficulty: q.difficulty,
          }
        }),
      }
      localStorage.setItem('axiom_last_attempt', JSON.stringify(resultPayload))
    }
    // Finalise the persisted attempt record (mirrors POST /api/attempts/:id/submit)
    if (attemptId) {
      await submitAttempt(attemptId, timeTaken)
    }
    router.push(`/practice/result?attempt=${attemptId || ''}`)
  }

  return (
    questionError || !currentQ ? (
      <div className="mx-auto max-w-xl px-4 py-16 text-sm text-zinc-400">
        {questionError || 'Loading questions from Axiom Prep…'}
      </div>
    ) : (
    <div className="text-ink flex flex-col justify-between">
      {/* Top Test Player Header */}
      <div className="sticky top-[4.5rem] z-30 border-b border-axiom/20 bg-[color:var(--chrome-solid)] px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-axiom">{subjectName}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-md">
                  {chapterName}
                </span>
                <span className="rounded bg-axiom/20 px-1.5 py-0.2 text-[10px] font-bold text-axiom border border-axiom/30">
                  {tierName}
                </span>
              </div>
              <div className="text-[11px] text-muted">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          {/* Timer & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-axiom/30 bg-card px-3.5 py-1.5 shadow-inner">
              <Clock className="h-4 w-4 text-axiom animate-pulse" />
              <div className="font-mono text-sm font-bold text-axiom">
                {formatTime(totalSecondsLeft)}
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-muted hover:text-ink ml-1"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="rounded-xl bg-linear-to-r from-[#e8c07a] to-axiom px-4 py-2 text-xs font-semibold text-black shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition"
            >
              Submit Practice
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Question Area + Palette */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Left / Center: Question & Options */}
        <div className="flex-1 flex flex-col justify-between rounded-3xl border border-line bg-card/60 p-6 md:p-8 backdrop-blur-xl">
          <div>
            {/* Question Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-axiom/20 px-3 py-1 font-mono text-xs font-bold text-axiom border border-axiom/30">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs text-muted">Single Choice Objective</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-card-hover px-2.5 py-0.5 text-zinc-400 font-mono">
                  +4 / -1 Marks
                </span>
                <span className="text-muted font-mono text-[11px]">
                  Time on Q: {formatTime(currentAttempt.timeSpentSeconds)}
                </span>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="space-y-4 mb-8">
              <p className="text-base sm:text-lg font-medium leading-relaxed text-ink">
                {currentQ.question}
              </p>

              {currentQ.formula && (
                <div className="rounded-xl border border-axiom/20 bg-card/80 p-3 font-mono text-xs text-axiom/90 inline-block">
                  <span className="text-[10px] uppercase text-zinc-500 block mb-0.5">Relevant Formula:</span>
                  <code>{currentQ.formula}</code>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-8">
              {currentQ.options.map((option) => {
                const isSelected = currentAttempt.selectedOption === option.id
                const isCorrect = option.id === currentQ.correctOption
                const revealed = currentAttempt.revealed

                let optionClass = 'border-line bg-card/60 hover:border-axiom/30 hover:bg-card-hover/60'
                let badgeClass = 'bg-card-hover text-zinc-400 group-hover:bg-card-hover'
                if (revealed) {
                  if (isCorrect) {
                    optionClass = 'border-emerald-500 bg-emerald-950/30'
                    badgeClass = 'bg-emerald-500 text-black'
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'border-rose-500 bg-rose-950/30'
                    badgeClass = 'bg-rose-500 text-black'
                  } else {
                    optionClass = 'border-line/60 bg-card/50 opacity-60'
                  }
                } else if (isSelected) {
                  optionClass = 'border-axiom bg-axiom/15 shadow-lg shadow-amber-500/10'
                  badgeClass = 'bg-axiom text-black'
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => !revealed && handleSelectOption(option.id)}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                      revealed ? 'cursor-default' : 'cursor-pointer'
                    } ${optionClass}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors ${badgeClass}`}
                    >
                      {option.id}
                    </div>
                    <div className="flex-1 text-sm font-medium text-ink group-hover:text-ink">
                      {option.text}
                    </div>
                    {revealed && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    {revealed && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
                  </div>
                )
              })}
            </div>

            {/* Solution panel (revealed after submitting the answer) */}
            {currentAttempt.revealed && (
              <div className="mb-8 rounded-2xl border border-axiom/30 bg-axiom/5 p-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-axiom">
                    <Lightbulb className="h-4 w-4" />
                    <span>
                      {currentAttempt.selectedOption === currentQ.correctOption ? 'Correct Answer' : 'Solution'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
                    <Clock className="h-3 w-3 text-axiom" />
                    {currentAttempt.solutionViewSeconds}s viewing
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearResponse}
                disabled={!currentAttempt.selectedOption || currentAttempt.revealed}
                className="rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Clear Response
              </button>

              <button
                onClick={handleToggleMark}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  currentAttempt.isMarked
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                    : 'border-line bg-card text-muted hover:text-ink'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{currentAttempt.isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAttempt.selectedOption || currentAttempt.revealed}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>{currentAttempt.revealed ? 'Solution Shown' : 'Submit Answer'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJumpToQuestion(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              <button
                onClick={handleMarkAndNext}
                className="rounded-xl border border-axiom/30 bg-axiom/10 px-3.5 py-2 text-xs font-bold text-axiom hover:bg-axiom/20 transition hidden sm:inline-block"
              >
                Mark &amp; Next
              </button>

              <button
                onClick={handleSaveAndNext}
                className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-[#e8c07a] to-axiom px-5 py-2 text-xs font-semibold text-black shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition"
              >
                <span>
                  {currentAttempt.revealed
                    ? currentIndex === questions.length - 1
                      ? 'Review'
                      : 'Next'
                    : currentIndex === questions.length - 1
                    ? 'Save & Review'
                    : 'Save & Next'}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette & Status */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="rounded-3xl border border-line bg-card/60 p-5 backdrop-blur-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
              Question Palette
            </h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-emerald-500 inline-block"></span>
                <span className="text-zinc-400">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-purple-500 inline-block"></span>
                <span className="text-zinc-400">Marked ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-card-hover inline-block border border-line"></span>
                <span className="text-zinc-400">Unanswered ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-axiom/40 inline-block border border-axiom"></span>
                <span className="text-zinc-400">Current Q</span>
              </div>
            </div>

            {/* Question Buttons Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx)
                const isCurrent = idx === currentIndex

                let colorClasses = 'border-line bg-card-hover/80 text-muted'
                if (status === 'answered') {
                  colorClasses = 'bg-emerald-500 text-black font-bold border-emerald-400'
                } else if (status === 'marked' || status === 'marked-answered') {
                  colorClasses = 'bg-purple-600 text-ink font-bold border-purple-400'
                }

                if (isCurrent) {
                  colorClasses += ' ring-2 ring-axiom ring-offset-2 ring-offset-[color:var(--bg)]'
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`flex h-10 w-full items-center justify-center rounded-xl border font-mono text-xs transition hover:scale-105 ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Exam Summary Box */}
          <div className="rounded-3xl border border-axiom/20 bg-axiom/5 p-5 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-axiom">
              <Sparkles className="h-4 w-4" />
              <span>Axiom Prep Diagnostic Engine</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Every answer is cross-referenced with past 10 years JEE &amp; NEET scoring patterns to compute your exact percentile estimate on the results screen.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in-up">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-axiom/30 bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-axiom/20 text-axiom">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">Submit Practice Session?</h3>
                <p className="text-xs text-muted">Review your attempt breakdown below</p>
              </div>
            </div>

            <div className="my-6 space-y-2.5 rounded-2xl border border-line/60 bg-card/60 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Total Questions:</span>
                <span className="font-bold text-ink">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Marked for Review:</span>
                <span className="font-bold text-purple-400">{markedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Unanswered:</span>
                <span className="font-bold text-rose-400">{unattemptedCount}</span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-2">
                <span className="text-muted">Time Remaining:</span>
                <span className="font-mono font-bold text-axiom">{formatTime(totalSecondsLeft)}</span>
              </div>
            </div>

            {unattemptedCount > 0 && (
              <div className="mb-6 flex items-start gap-2 text-xs text-axiom/90 bg-axiom/10 p-3 rounded-xl border border-axiom/20">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>You still have {unattemptedCount} unanswered questions. Are you sure you want to submit?</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl border border-line bg-card px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-ink"
              >
                Resume Practice
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="rounded-xl bg-linear-to-r from-[#e8c07a] to-axiom px-5 py-2.5 text-xs font-semibold text-black shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 disabled:opacity-60 transition"
              >
                {submitting ? 'Submitting…' : 'Confirm & View Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  )
}

function mapApiQuestion(
  item: Record<string, unknown>,
  index: number,
  subject: string,
  chapter: string,
  tier: number,
): Question {
  const rawOptions = Array.isArray(item.options) ? item.options : []
  const letters = ['A', 'B', 'C', 'D'] as const
  const options = letters.map((letter, optionIndex) => {
    const raw = rawOptions[optionIndex]
    if (typeof raw === 'string') return { id: letter, text: raw }
    const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    return { id: letter, text: String(record.text || record.label || record.value || '') }
  })
  const correct = String(item.correct_option || item.correctOption || 'A').toUpperCase()
  return {
    id: Number(item.id ?? index + 1) || index + 1,
    subject,
    classNum: '11',
    chapter,
    tier,
    tierName: String(item.tier_name || `Tier ${tier}`),
    difficulty: 'Medium',
    question: String(item.question || item.prompt || item.text || ''),
    formula: typeof item.formula === 'string' ? item.formula : undefined,
    options,
    correctOption: correct === 'B' || correct === 'C' || correct === 'D' ? correct : 'A',
    explanation: String(item.explanation || item.solution || ''),
  }
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted">Loading Practice Player...</div>}>
      <PlayerContent />
    </Suspense>
  )
}
