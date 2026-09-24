import { api, ApiClientError } from './api'
import { clearAccessToken, getAccessToken, setAccessToken } from './session'
import {
  examTrackFromInterests,
  normalizePhone,
  targetExamFromInterests,
  type ClassLevel,
  type ExamInterest,
} from './student-profile'

export interface AxiomUser {
  id: string
  email: string
  name: string
}

const SESSION_KEY = 'axiom_auth_session'

type AuthListener = (user: AxiomUser | null) => void

let currentUser: AxiomUser | null = null
const listeners = new Set<AuthListener>()

function readStoredSession(): AxiomUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AxiomUser) : null
  } catch {
    return null
  }
}

function emit(user: AxiomUser | null) {
  currentUser = user
  listeners.forEach((cb) => cb(user))
}

function clearLocalSession() {
  clearAccessToken()
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY)
}

/** Restore an existing session (runs once at startup on the client). */
export function initAuth(): AxiomUser | null {
  if (currentUser) return currentUser
  if (!getAccessToken()) {
    currentUser = null
    return null
  }
  const user = readStoredSession()
  currentUser = user
  return user
}

export function getCurrentUser(): AxiomUser | null {
  if (!getAccessToken()) return null
  if (currentUser) return currentUser
  return readStoredSession()
}

export function onAuthChange(cb: AuthListener): () => void {
  listeners.add(cb)
  cb(getCurrentUser())
  return () => listeners.delete(cb)
}

const SIGN_UP_PATHS = ['/api/auth/signup', '/api/signup', '/api/auth/register', '/api/register']
const SIGN_IN_PATHS = ['/api/auth/signin', '/api/signin', '/api/auth/login', '/api/login']

function readToken(data: Record<string, unknown>): string | null {
  const session = asRecord(data.session)
  const nested = asRecord(data.data)
  const candidates = [
    data.access_token,
    data.token,
    data.jwt,
    session?.access_token,
    session?.token,
    nested?.access_token,
    nested?.token,
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value && !value.startsWith('google.')) return value
  }
  return null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function mapProfile(raw: unknown): AxiomUser {
  const root = asRecord(raw) || {}
  const profile = asRecord(root.user) || asRecord(root.profile) || asRecord(root.me) || root
  const email = String(profile.email || root.email || '')
  const name = String(
    profile.full_name || profile.name || root.full_name || root.name || email.split('@')[0] || 'Student'
  )
  const id = String(profile.id || root.id || email || 'student')
  return { id, email, name }
}

async function postFirst(paths: string[], body: Record<string, unknown>) {
  let last = 'The Axiom Prep API did not accept this request.'
  for (const path of paths) {
    try {
      return await api<Record<string, unknown>>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        last = err.message
        continue
      }
      throw err
    }
  }
  throw new ApiClientError(404, 'not_found', last)
}

async function establishSession(payload: Record<string, unknown>, fallback: { email: string; name: string }) {
  const token = readToken(payload)
  if (token) setAccessToken(token)
  const me = await api<unknown>('/api/me')
  const user = mapProfile(me)
  persistAndEmit({
    id: user.id || fallback.email,
    email: user.email || fallback.email,
    name: user.name || fallback.name,
  })
  return getCurrentUser() as AxiomUser
}

export async function refreshSession(): Promise<AxiomUser | null> {
  const token = getAccessToken()
  if (!token) {
    clearLocalSession()
    emit(null)
    return null
  }

  try {
    const me = await api<unknown>('/api/me')
    const user = mapProfile(me)
    persistAndEmit(user)
    return user
  } catch {
    clearLocalSession()
    if (typeof window !== 'undefined') {
      await fetch('/auth/session', { method: 'DELETE' }).catch(() => {})
    }
    emit(null)
    return null
  }
}

export async function updateProfile(body: Record<string, unknown>): Promise<{ user: AxiomUser | null; error: string | null }> {
  try {
    const me = await api<unknown>('/api/me', { method: 'PATCH', body: JSON.stringify(body) })
    const user = mapProfile(me)
    persistAndEmit(user)
    return { user, error: null }
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Could not update your profile.' }
  }
}

export type SignupDetails = {
  email: string
  password: string
  full_name: string
  phone: string
  class_level: ClassLevel
  exam_interests: ExamInterest[]
}

export async function signUpWithEmail(
  details: SignupDetails
): Promise<{ user: AxiomUser | null; error: string | null; needsEmailConfirmation?: boolean }> {
  const email = details.email.trim()
  const name = details.full_name.trim()
  const phone = normalizePhone(details.phone)
  const examTrack = examTrackFromInterests(details.exam_interests)
  const targetExam = targetExamFromInterests(details.exam_interests)
  const payload = {
    email,
    password: details.password,
    full_name: name,
    name,
    phone,
    class_level: details.class_level,
    exam_interests: details.exam_interests,
    exam_track: examTrack,
    target_exam: targetExam,
  }
  try {
    const data = await postFirst(SIGN_UP_PATHS, payload)
    if (data.needs_email_confirmation || !readToken(data)) {
      return { user: null, error: null, needsEmailConfirmation: true }
    }
    const user = await establishSession(data, { email, name: name || email.split('@')[0] })
    await updateProfile({
      full_name: name,
      phone,
      class_level: details.class_level,
      exam_interests: details.exam_interests,
      exam_track: examTrack,
      target_exam: targetExam,
    }).catch(() => ({ user: null, error: null }))
    return { user, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed.'
    if (/confirm|verification/i.test(message) && !/already|invalid|password/i.test(message)) {
      return { user: null, error: null, needsEmailConfirmation: true }
    }
    return { user: null, error: message }
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AxiomUser | null; error: string | null }> {
  try {
    const data = await postFirst(SIGN_IN_PATHS, { email, password })
    const user = await establishSession(data, { email, name: email.split('@')[0] })
    return { user, error: null }
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Sign in failed.' }
  }
}

export async function signOut(): Promise<void> {
  clearLocalSession()
  if (typeof window !== 'undefined') {
    await fetch('/auth/session', { method: 'DELETE' }).catch(() => {})
  }
  emit(null)
}

function persistAndEmit(user: AxiomUser) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
  emit(user)
}

/**
 * Subscribe to live Supabase auth changes when configured; otherwise the
 * in-memory listeners already cover the local fallback.
 */
export function bindSupabaseAuthEvents(): () => void {
  return () => {}
}
