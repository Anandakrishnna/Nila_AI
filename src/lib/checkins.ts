import { supabase } from '@/lib/supabase'

export type TranscriptEntry = { role: 'user' | 'assistant'; text: string }
export type CheckinResult = {
  status: 'completed'
  callId: string
  overallTone: string | null
  summary: string
  highlights: string[]
  followUpItems: string[]
  observations: Array<{ category: string; text: string; source_excerpt: string }>
  historicalChange: string | null
  urgency: 'normal' | 'follow_up' | 'urgent'
}

async function functionErrorMessage(error: unknown) {
  const context = (error as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return null
  try {
    const body = await context.clone().json() as { error?: unknown }
    return typeof body.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error || !data) {
    const message = await functionErrorMessage(error)
    if (import.meta.env.DEV) console.error(`${name} failed.`, { error, message })
    throw new Error(message || 'Nila could not complete that step. Please try again.')
  }
  return data
}

export async function createRealtimeSession(parentId: string) {
  return invoke<{ clientSecret: string; expiresAt: number | null; callId: string }>('realtime-session', { parentId })
}

export async function completeCheckin(parentId: string, callId: string, transcript: TranscriptEntry[], durationSeconds: number) {
  return invoke<CheckinResult>('complete-checkin', { parentId, callId, transcript, durationSeconds })
}

export async function abandonCheckin(callId: string) {
  return invoke<{ status: 'abandoned' }>('complete-checkin', { action: 'abandon', callId })
}
