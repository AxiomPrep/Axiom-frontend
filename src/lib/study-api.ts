import { api } from '@/lib/api'
import type { Subject, Chapter, PracticeTier, PYQExamSet, Question } from '@/data/mockCurriculum'

/**
 * Client-side API layer for the Axiom Prep backend.
 * Every helper here calls `/api/*` (proxied to the live API).
 */

/* ------------------------------------------------------------------ *
 * Shared types
 * ------------------------------------------------------------------ */

export interface Plan {
  id: string
  name: string
  price: number
  priceLabel: string
  tagline: string
  features: string[]
  highlight?: boolean
  type: string
  durationDays: number
  mentorship: string
}

export interface LeaderboardEntry {
  rank: number
  name: string
  subject: string
  gold: number
  silver: number
}

export interface CoinWallet {
  gold: number
  silver: number
}

export interface Me {
  id: string
  name: string
  email: string
  plan: string | null
  trialDaysLeft: number
}

export interface AnnotationRecord {
  id: string
  setId: string
  page: number
  highlights: { text: string; color: string }[]
  strokes: { color: string; size: number; points: { x: number; y: number }[] }[]
  html?: string
  updatedAt: string
}

export interface AttemptAnswerPayload {
  questionId: number
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  timeSpentSeconds: number
  solutionViewSeconds: number
}

export interface AttemptRecord {
  id: string
  type: 'practice' | 'pyq'
  subjectId: string
  classLevel: '11' | '12'
  chapterId: string
  tierId?: number
  examSetId?: string
  startedAt: string
  submittedAt?: string
  totalSeconds: number
  answers: Record<number, AttemptAnswerPayload>
  result?: AttemptResult
}

export interface AttemptResult {
  score: number
  maxScore: number
  correct: number
  wrong: number
  unattempted: number
  accuracy: number
  timeTakenSeconds: number
  questions: QuestionResult[]
  chapterBreakdown: { topic: string; correct: number; total: number }[]
}

export interface QuestionResult {
  questionId: number
  questionText: string
  formula?: string
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  correctOption: 'A' | 'B' | 'C' | 'D'
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  isCorrect: boolean
  timeSpent: number
  solutionViewSeconds: number
  explanation: string
  difficulty: string
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asList(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>
  }
  const rec = asRecord(value)
  if (!rec) return []
  for (const key of ['questions', 'exams', 'subjects', 'chapters', 'tiers', 'plans', 'annotations', 'entries', 'leaderboard', 'attempts']) {
    if (Array.isArray(rec[key])) return asList(rec[key])
  }
  return []
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/* ------------------------------------------------------------------ *
 * Practice
 * ------------------------------------------------------------------ */

export async function getPracticeSubjects(): Promise<Subject[]> {
  const data = await api<{ subjects?: Array<Record<string, unknown>> }>('/api/practice/subjects')
  return asList(data.subjects ?? data).map((subject) => ({
    id: String(subject.slug || subject.id || ''),
    name: String(subject.name || 'Subject'),
    tagline: String(subject.tagline || subject.description || ''),
    color: '',
    badgeColor: '',
    totalQuestions: num(subject.total_questions ?? subject.question_count),
    totalChapters: num(subject.total_chapters),
    class11Count: num(subject.class_11_count ?? subject.class11_count),
    class12Count: num(subject.class_12_count ?? subject.class12_count),
    iconName: '',
    formula: String(subject.formula || ''),
  }))
}

export async function getPracticeSubject(slug: string): Promise<Subject | null> {
  const subjects = await getPracticeSubjects()
  return subjects.find((s) => s.id === slug) ?? null
}

export async function getPracticeChapters(
  slug: string,
  classLevel: '11' | '12'
): Promise<Chapter[]> {
  const data = await api<{ chapters?: Array<Record<string, unknown>> }>(
    `/api/practice/subjects/${slug}/classes/${classLevel}/chapters`,
  )
  return asList(data.chapters ?? data).map((chapter) => ({
    id: String(chapter.id),
    name: String(chapter.title || chapter.name || 'Chapter'),
    subjectId: slug,
    classNum: classLevel,
    jeeCount: num(chapter.jee_count),
    neetCount: num(chapter.neet_count),
    advCount: num(chapter.adv_count),
    totalCount: num(chapter.total_count || chapter.question_count),
    completedCount: num(chapter.completed_count),
    highYield: Boolean(chapter.high_yield || chapter.highYield),
  }))
}

export async function getPracticeTiers(): Promise<PracticeTier[]> {
  const data = await api<{ tiers?: Array<Record<string, unknown>> }>('/api/practice/tiers')
  return asList(data.tiers ?? data).map((item, index) => ({
    tier: num(item.tier || item.level || index + 1),
    name: String(item.name || item.title || `Tier ${index + 1}`),
    subtitle: String(item.subtitle || ''),
    difficulty: String(item.difficulty || ''),
    timePerQuestion: String(item.time_per_question || item.time || ''),
    badge: String(item.badge || `Tier ${item.tier || index + 1}`),
    description: String(item.description || ''),
    questionCount: num(item.question_count || item.questions),
  }))
}

export async function createPracticeAttempt(payload: {
  subjectId: string
  classLevel: '11' | '12'
  chapterId: string
  tierId: number
  totalSeconds: number
}): Promise<AttemptRecord> {
  const data = await api<Record<string, unknown>>('/api/practice/attempt', {
    method: 'POST',
    body: JSON.stringify({
      subject: payload.subjectId,
      subject_id: payload.subjectId,
      class: payload.classLevel,
      class_level: payload.classLevel,
      chapter_id: payload.chapterId,
      tier: payload.tierId,
      total_seconds: payload.totalSeconds,
    }),
  })
  const nested = (data.attempt && typeof data.attempt === 'object' ? data.attempt : data) as Record<string, unknown>
  const id = String(nested.id || data.id || '')
  if (!id) throw new Error('The API did not create a practice attempt.')
  return {
    id,
    type: 'practice',
    subjectId: payload.subjectId,
    classLevel: payload.classLevel,
    chapterId: payload.chapterId,
    tierId: payload.tierId,
    startedAt: new Date().toISOString(),
    totalSeconds: payload.totalSeconds,
    answers: {},
  }
}

/* ------------------------------------------------------------------ *
 * PYQ
 * ------------------------------------------------------------------ */

export async function getPyqSubjects(): Promise<Subject[]> {
  const data = await api<{ subjects?: Array<Record<string, unknown>> }>('/api/pyq/subjects')
  return asList(data.subjects ?? data).map((subject) => ({
    id: String(subject.slug || subject.id || ''),
    name: String(subject.name || 'Subject'),
    tagline: '',
    color: '',
    badgeColor: '',
    totalQuestions: num(subject.total_questions ?? subject.question_count),
    totalChapters: 0,
    class11Count: num(subject.class_11_count),
    class12Count: num(subject.class_12_count),
    iconName: '',
    formula: '',
  }))
}

export async function getPyqExams(): Promise<PYQExamSet[]> {
  const data = await api<{ exams?: Array<Record<string, unknown>> }>('/api/pyq/exams')
  return asList(data.exams ?? data).map((exam) => ({
    id: String(exam.id),
    examName: String(exam.exam_name || exam.name || exam.title || 'Exam'),
    year: num(exam.year),
    shift: String(exam.shift || ''),
    subject: String(exam.subject || ''),
    classNum: String(exam.class || exam.class_level || '11') === '12' ? '12' : '11',
    chapter: String(exam.chapter_id || exam.chapter || ''),
    questionCount: num(exam.question_count),
    durationMinutes: num(exam.duration_minutes || exam.duration),
    difficulty: String(exam.difficulty || ''),
  }))
}

function questionToPage(item: Record<string, unknown>, index: number) {
  const rawOptions = Array.isArray(item.options) ? item.options : []
  const options = rawOptions
    .map((raw, optionIndex) => {
      const letter = ['A', 'B', 'C', 'D'][optionIndex] || String(optionIndex + 1)
      if (typeof raw === 'string') return `${letter}) ${raw}`
      const record = asRecord(raw) || {}
      return `${letter}) ${String(record.text || record.label || record.value || '')}`
    })
    .join('\n')
  const prompt = String(item.question || item.prompt || item.stem || item.text || '')
  const formula = typeof item.formula === 'string' ? `\n\nFormula: ${item.formula}` : ''
  return `Q${index + 1}. ${prompt}${formula}${options ? `\n\nOptions:\n${options}` : ''}`
}

export async function getPyqSetPages(setId: string): Promise<string[]> {
  if (!setId) throw new Error('Missing PYQ set id.')
  let title = 'PYQ exam set'
  let questions: Array<Record<string, unknown>> = []
  try {
    const exam = await api<Record<string, unknown>>(`/api/pyq/exams/${setId}`)
    const nested = asRecord(exam.exam) || exam
    title = String(nested.exam_name || nested.name || nested.title || title)
    questions = asList(nested.questions ?? exam.questions)
  } catch {
    /* try question list next */
  }
  if (!questions.length) {
    const data = await api<unknown>(`/api/questions?exam_set_id=${encodeURIComponent(setId)}&pyq_set_id=${encodeURIComponent(setId)}`)
    questions = asList(data)
  }
  if (!questions.length) throw new Error('This PYQ set has no questions on the API.')
  return [
    `${title}\n\nOfficial paper loaded from the Axiom Prep API. Highlight and annotate as you solve.`,
    ...questions.map((item, index) => questionToPage(item, index)),
    'Solution notes — your marks sync through /api/annotations.',
  ]
}

export async function getPracticeSetPages(query: {
  subject: string
  chapterId: string
  tier: number
  classLevel?: string
}): Promise<{ title: string; subtitle: string; pages: string[] }> {
  const params = new URLSearchParams({
    subject: query.subject,
    chapter_id: query.chapterId,
    tier: String(query.tier),
  })
  if (query.classLevel) params.set('class', query.classLevel)
  const data = await api<unknown>(`/api/questions?${params}`)
  const questions = asList(data)
  const title = `${query.subject} · Tier ${query.tier}`
  const subtitle = `${query.chapterId} · Class ${query.classLevel || ''}`.trim()
  if (!questions.length) throw new Error('No questions were returned for this practice set.')
  return {
    title,
    subtitle,
    pages: [
      `${title}\n\n${subtitle}\n\nQuestions loaded from the Axiom Prep API.`,
      ...questions.map((item, index) => questionToPage(item, index)),
      'Solution notes — your marks sync through /api/annotations.',
    ],
  }
}

/* ------------------------------------------------------------------ *
 * Attempts
 * ------------------------------------------------------------------ */

export async function getAttempt(id: string): Promise<AttemptRecord | null> {
  const data = await api<Record<string, unknown>>(`/api/attempts/${id}`)
  const nested = asRecord(data.attempt) || data
  const idValue = String(nested.id || data.id || id)
  if (!idValue) return null
  return {
    id: idValue,
    type: String(nested.type || 'practice') === 'pyq' ? 'pyq' : 'practice',
    subjectId: String(nested.subject_id || nested.subject || ''),
    classLevel: String(nested.class_level || nested.class || '11') === '12' ? '12' : '11',
    chapterId: String(nested.chapter_id || nested.chapter || ''),
    tierId: num(nested.tier || nested.tier_id, 0) || undefined,
    examSetId: nested.exam_set_id ? String(nested.exam_set_id) : undefined,
    startedAt: String(nested.started_at || new Date().toISOString()),
    submittedAt: nested.submitted_at ? String(nested.submitted_at) : undefined,
    totalSeconds: num(nested.total_seconds || nested.duration_sec),
    answers: {},
  }
}

export async function answerAttempt(
  id: string,
  payload: AttemptAnswerPayload
): Promise<AttemptRecord | null> {
  await api(`/api/attempts/${id}/answer`, {
    method: 'POST',
    body: JSON.stringify({
      question_id: payload.questionId,
      selected_option: payload.selectedOption,
      time_spent_seconds: payload.timeSpentSeconds,
      solution_view_seconds: payload.solutionViewSeconds,
    }),
  })
  return {
    id,
    type: 'practice',
    subjectId: '',
    classLevel: '11',
    chapterId: '',
    startedAt: new Date().toISOString(),
    totalSeconds: payload.timeSpentSeconds,
    answers: { [payload.questionId]: payload },
  }
}

export async function submitAttempt(id: string, timeTakenSeconds?: number): Promise<AttemptRecord | null> {
  await api(`/api/attempts/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ time_taken_seconds: timeTakenSeconds }),
  })
  return {
    id,
    type: 'practice',
    subjectId: '',
    classLevel: '11',
    chapterId: '',
    startedAt: new Date().toISOString(),
    totalSeconds: timeTakenSeconds || 0,
    submittedAt: new Date().toISOString(),
    answers: {},
  }
}

function mapQuestionResult(item: Record<string, unknown>, index: number): QuestionResult {
  const rawOptions = Array.isArray(item.options) ? item.options : []
  const letters = ['A', 'B', 'C', 'D'] as const
  const options = letters.map((letter, optionIndex) => {
    const raw = rawOptions[optionIndex]
    if (typeof raw === 'string') return { id: letter, text: raw }
    const record = asRecord(raw) || {}
    const id = String(record.id || letter).toUpperCase()
    return {
      id: id === 'B' || id === 'C' || id === 'D' ? id : letter,
      text: String(record.text || record.label || record.value || ''),
    }
  })
  const correctRaw = String(item.correct_option || item.correctOption || 'A').toUpperCase()
  const selectedRaw = item.selected_option ?? item.selectedOption ?? item.selected_answer
  const selected =
    selectedRaw === 'A' || selectedRaw === 'B' || selectedRaw === 'C' || selectedRaw === 'D'
      ? selectedRaw
      : null
  const correct = correctRaw === 'B' || correctRaw === 'C' || correctRaw === 'D' ? correctRaw : 'A'
  const isCorrect = Boolean(item.is_correct ?? item.isCorrect ?? (selected && selected === correct))
  return {
    questionId: num(item.question_id ?? item.id ?? index + 1, index + 1),
    questionText: String(item.question || item.question_text || item.stem || item.prompt || ''),
    formula: typeof item.formula === 'string' ? item.formula : undefined,
    options,
    correctOption: correct,
    selectedOption: selected,
    isCorrect,
    timeSpent: num(item.time_spent || item.time_spent_seconds || item.timeSpent),
    solutionViewSeconds: num(item.solution_view_seconds || item.solutionViewSeconds),
    explanation: String(item.explanation || item.solution || ''),
    difficulty: String(item.difficulty || ''),
  }
}

export async function getAttemptResult(id: string): Promise<AttemptResult | null> {
  const paths = [`/api/attempts/${id}/result`, `/api/attempts/${id}`, `/api/practice/attempts/${id}`]
  let last: unknown = null
  for (const path of paths) {
    try {
      last = await api<Record<string, unknown>>(path)
      break
    } catch {
      /* try next shape */
    }
  }
  const root = asRecord(last)
  if (!root) return null
  const nested = asRecord(root.result) || asRecord(root.attempt) || root
  const questions = asList(nested.questions || nested.answers || root.questions).map(mapQuestionResult)
  if (!questions.length) return null
  const correct = num(nested.correct, questions.filter((q) => q.isCorrect).length)
  const wrong = num(nested.wrong, questions.filter((q) => q.selectedOption && !q.isCorrect).length)
  const unattempted = num(nested.unattempted, questions.filter((q) => !q.selectedOption).length)
  const score = num(nested.score ?? nested.raw_score, correct * 4 - wrong)
  const maxScore = num(nested.max_score ?? nested.maxScore, questions.length * 4)
  return {
    score,
    maxScore,
    correct,
    wrong,
    unattempted,
    accuracy: num(nested.accuracy, Math.round((correct / (correct + wrong || 1)) * 100)),
    timeTakenSeconds: num(nested.time_taken_seconds ?? nested.timeTakenSeconds ?? nested.duration_sec),
    questions,
    chapterBreakdown: asList(nested.chapter_breakdown || nested.chapterBreakdown).map((row) => ({
      topic: String(row.topic || row.title || row.chapter || 'Chapter'),
      correct: num(row.correct),
      total: num(row.total || row.question_count),
    })),
  }
}

/* ------------------------------------------------------------------ *
 * User / Subscription
 * ------------------------------------------------------------------ */

export async function getMe(): Promise<Me> {
  const data = await api<Record<string, unknown>>('/api/me')
  const profile = asRecord(data.user) || asRecord(data.profile) || asRecord(data.me) || data
  return {
    id: String(profile.id || data.id || ''),
    name: String(profile.full_name || profile.name || 'Student'),
    email: String(profile.email || ''),
    plan: profile.plan ? String(profile.plan) : null,
    trialDaysLeft: num(profile.trial_days_left ?? profile.trialDaysLeft),
  }
}

export async function getPlans(): Promise<Plan[]> {
  const data = await api<{ plans?: Array<Record<string, unknown>> }>('/api/plans')
  return (data.plans || []).map((plan, index) => {
    const price = Number(plan.price_inr ?? plan.price ?? 0)
    const featureRecord = plan.features
    const bullets = Array.isArray(plan.bullets)
      ? plan.bullets.map(String)
      : featureRecord && typeof featureRecord === 'object' && !Array.isArray(featureRecord)
        ? Object.keys(featureRecord)
        : Array.isArray(featureRecord)
          ? featureRecord.map(String)
          : []
    return {
      id: String(plan.id),
      name: String(plan.name || 'Plan'),
      price,
      priceLabel: price ? `₹${price.toLocaleString()}` : 'Free',
      tagline: String(plan.tagline || plan.type || ''),
      features: bullets,
      highlight: index === 1,
      type: String(plan.type || ''),
      durationDays: Number(plan.duration_days || 0),
      mentorship: String(plan.mentorship_tier || 'none'),
    }
  })
}

export interface CheckoutPayload {
  id: string
  planId: string
  orderId: string
  amount: number
  currency: string
  key: string
}

export async function createCheckout(planId: string): Promise<CheckoutPayload> {
  const data = await api<Record<string, unknown>>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId }),
  })
  const nested = (data.checkout || data.order || data) as Record<string, unknown>
  return {
    id: String(nested.id || data.id || planId),
    planId,
    orderId: String(nested.order_id || nested.orderId || nested.id || ''),
    amount: Number(nested.amount || nested.amount_paise || 0),
    currency: String(nested.currency || 'INR'),
    key: String(nested.key || nested.razorpay_key || ''),
  }
}

export async function confirmCheckout(checkoutId: string): Promise<{ ok: boolean }> {
  await api('/api/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify({ checkout_id: checkoutId, order_id: checkoutId }),
  })
  return { ok: true }
}

/* ------------------------------------------------------------------ *
 * Coins / Leaderboard
 * ------------------------------------------------------------------ */

export async function getCoins(): Promise<CoinWallet> {
  const data = await api<Record<string, unknown>>('/api/coins')
  const wallet = (data.wallet || data.coins || data) as Record<string, unknown>
  return {
    gold: Number(wallet.gold ?? wallet.gold_coins ?? 0),
    silver: Number(wallet.silver ?? wallet.silver_coins ?? 0),
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const data = await api<{ entries?: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] } | LeaderboardEntry[]>(
    '/api/leaderboards'
  )
  const list = Array.isArray(data) ? data : data.entries || data.leaderboard || []
  return list.map((entry, index) => ({
    rank: Number(entry.rank || index + 1),
    name: String(entry.name || 'Student'),
    subject: String(entry.subject || ''),
    gold: Number(entry.gold ?? 0),
    silver: Number(entry.silver ?? 0),
  }))
}

/* ------------------------------------------------------------------ *
 * Annotations
 * ------------------------------------------------------------------ */

function annotationSource(setId: string) {
  const sourceType = setId.startsWith('pyq-') ? 'pyq' : 'quiz'
  return { sourceType, sourceId: setId }
}

export async function getAnnotations(setId: string): Promise<AnnotationRecord[]> {
  const { sourceType, sourceId } = annotationSource(setId)
  const data = await api<unknown>(`/api/annotations?source_type=${sourceType}&source_id=${encodeURIComponent(sourceId)}`)
  return asList(asRecord(data)?.annotations ?? data).map((item) => {
    const payload = asRecord(item.payload) || {}
    const highlights = Array.isArray(payload.highlights)
      ? (payload.highlights as AnnotationRecord['highlights'])
      : []
    const strokes = Array.isArray(payload.strokes) ? (payload.strokes as AnnotationRecord['strokes']) : []
    return {
      id: String(item.id || makeId('ann')),
      setId,
      page: num(item.page_number ?? item.page),
      highlights,
      strokes,
      html: typeof payload.html === 'string' ? payload.html : undefined,
      updatedAt: String(item.updated_at || item.updatedAt || new Date().toISOString()),
    }
  })
}

export async function saveAnnotation(
  input: Omit<AnnotationRecord, 'id' | 'updatedAt'>
): Promise<AnnotationRecord> {
  const { sourceType, sourceId } = annotationSource(input.setId)
  const data = await api<Record<string, unknown>>('/api/annotations', {
    method: 'POST',
    body: JSON.stringify({
      source_type: sourceType,
      source_id: sourceId,
      page_number: input.page,
      annotation_type: 'note',
      payload: {
        html: input.html,
        highlights: input.highlights,
        strokes: input.strokes,
      },
    }),
  })
  const nested = asRecord(data.annotation) || data
  return {
    ...input,
    id: String(nested.id || makeId('ann')),
    updatedAt: String(nested.updated_at || new Date().toISOString()),
  }
}

export async function deleteAnnotation(id: string): Promise<void> {
  await api(`/api/annotations?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}
