import { supabase } from '@/lib/supabase'

interface SupabaseErrorDetails {
  code?: string
  details?: string | null
  hint?: string | null
  message?: string
}

class ParentCreationError extends Error {
  constructor(message: string, readonly supabaseError: SupabaseErrorDetails) {
    super(message)
    this.name = 'ParentCreationError'
  }
}

function getParentCreationMessage(error: SupabaseErrorDetails) {
  if (error.code === 'PGRST202') return 'We’re still setting up parent profiles. Please try again shortly.'
  if (error.code === '23503') return 'Your account setup is incomplete. Please sign out, sign in again, and try once more.'
  return 'We could not save this parent. Please try again.'
}

export interface CheckinObservation {
  id: string
  category: string
  text: string
  createdAt: string
}

export interface CheckinAlert {
  id: string
  severity: 'follow_up' | 'urgent'
  message: string
  createdAt: string
}

export interface CheckinRecord {
  id: string
  status: string
  createdAt: string
  endedAt: string | null
  durationSeconds: number | null
  overallTone: string | null
  summary: string | null
  followUpItems: string[]
  historicalChange: string | null
  observations: CheckinObservation[]
  alerts: CheckinAlert[]
}

export interface ParentSchedule {
  frequency: 'daily' | 'weekly'
  localTime: string
  timezone: string
  daysOfWeek: number[] | null
}

export interface ParentRecord {
  id: string
  fullName: string
  relationship: string
  preferredLanguage: string
  timezone: string
  lastCheckIn: string | null
  latestCheckIn: CheckinRecord | null
  recentCheckIns: CheckinRecord[]
  schedule: ParentSchedule | null
}

interface ParentJoin {
  id: string
  full_name: string
  preferred_language: string
  timezone: string
}

interface RelationshipJoin {
  relationship: string
  parent: ParentJoin | null
}

interface SummaryJoin {
  call_id: string
  overall_tone: string | null
  summary_text: string
  follow_up_text: string | null
  historical_change_text: string | null
}

interface ObservationJoin {
  id: string
  call_id: string
  category: string
  observation_text: string
  created_at: string
}

interface AlertJoin {
  id: string
  call_id: string | null
  severity: 'follow_up' | 'urgent'
  message: string
  created_at: string
  is_resolved: boolean
}

interface CallJoin {
  id: string
  parent_id: string
  status: string
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
}

interface ScheduleJoin {
  parent_id: string
  timezone: string
  local_time: string
  frequency: 'daily' | 'weekly'
  days_of_week: number[] | null
}

function byNewest<T extends { created_at: string }>(left: T, right: T) {
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
}

function splitFollowUps(value: string | null) {
  return value?.split('\n').map((item) => item.trim()).filter(Boolean) ?? []
}

function toCheckin(call: CallJoin, summary: SummaryJoin | undefined, observations: ObservationJoin[], alerts: AlertJoin[]): CheckinRecord {
  return {
    id: call.id,
    status: call.status,
    createdAt: call.created_at,
    endedAt: call.ended_at,
    durationSeconds: call.duration_seconds,
    overallTone: summary?.overall_tone ?? null,
    summary: summary?.summary_text ?? null,
    followUpItems: splitFollowUps(summary?.follow_up_text ?? null),
    historicalChange: summary?.historical_change_text ?? null,
    observations: [...observations].sort(byNewest).map((observation) => ({
      id: observation.id,
      category: observation.category,
      text: observation.observation_text,
      createdAt: observation.created_at,
    })),
    alerts: [...alerts].filter((alert) => !alert.is_resolved).sort(byNewest).map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      message: alert.message,
      createdAt: alert.created_at,
    })),
  }
}

export async function getParents(): Promise<ParentRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data: relationships, error: relationshipError } = await supabase
    .from('parent_relationships')
    .select('relationship, parent:parents(id, full_name, preferred_language, timezone)')
    .order('created_at', { ascending: true })
  if (relationshipError) throw relationshipError

  const linkedParents = ((relationships ?? []) as unknown as RelationshipJoin[])
    .filter((item): item is RelationshipJoin & { parent: ParentJoin } => item.parent !== null)
  if (!linkedParents.length) return []

  const { data: calls, error: callError } = await supabase
    .from('calls')
    .select('id, parent_id, status, ended_at, duration_seconds, created_at')
    .in('parent_id', linkedParents.map((item) => item.parent.id))
    .order('created_at', { ascending: false })
    .limit(50)
  if (callError) throw callError

  const { data: schedules, error: scheduleError } = await supabase
    .from('call_schedules')
    .select('parent_id, timezone, local_time, frequency, days_of_week')
    .in('parent_id', linkedParents.map((item) => item.parent.id))
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (scheduleError) throw scheduleError

  const schedulesByParent = new Map<string, ParentSchedule>()
  for (const schedule of (schedules ?? []) as unknown as ScheduleJoin[]) {
    if (!schedulesByParent.has(schedule.parent_id)) {
      schedulesByParent.set(schedule.parent_id, {
        frequency: schedule.frequency,
        localTime: schedule.local_time,
        timezone: schedule.timezone,
        daysOfWeek: schedule.days_of_week,
      })
    }
  }

  const completedCalls = (calls ?? []) as unknown as CallJoin[]
  if (!completedCalls.length) {
    return linkedParents.map((item) => ({
      id: item.parent.id,
      fullName: item.parent.full_name,
      relationship: item.relationship,
      preferredLanguage: item.parent.preferred_language,
      timezone: item.parent.timezone,
      lastCheckIn: null,
      latestCheckIn: null,
      recentCheckIns: [],
      schedule: schedulesByParent.get(item.parent.id) ?? null,
    }))
  }

  const callIds = completedCalls.map((call) => call.id)
  const [summaryResult, observationResult, alertResult] = await Promise.all([
    supabase.from('call_summaries').select('call_id, overall_tone, summary_text, follow_up_text, historical_change_text').in('call_id', callIds),
    supabase.from('observations').select('id, call_id, category, observation_text, created_at').in('call_id', callIds),
    supabase.from('alerts').select('id, call_id, severity, message, created_at, is_resolved').in('call_id', callIds),
  ])
  if (summaryResult.error) throw summaryResult.error
  if (observationResult.error) throw observationResult.error
  if (alertResult.error) throw alertResult.error

  const summariesByCall = new Map(((summaryResult.data ?? []) as unknown as SummaryJoin[]).map((summary) => [summary.call_id, summary]))
  const observationsByCall = new Map<string, ObservationJoin[]>()
  for (const observation of (observationResult.data ?? []) as unknown as ObservationJoin[]) {
    const observations = observationsByCall.get(observation.call_id) ?? []
    observations.push(observation)
    observationsByCall.set(observation.call_id, observations)
  }
  const alertsByCall = new Map<string, AlertJoin[]>()
  for (const alert of (alertResult.data ?? []) as unknown as AlertJoin[]) {
    if (!alert.call_id) continue
    const alerts = alertsByCall.get(alert.call_id) ?? []
    alerts.push(alert)
    alertsByCall.set(alert.call_id, alerts)
  }

  const checkinsByParent = new Map<string, CheckinRecord[]>()
  for (const call of completedCalls) {
    const checkins = checkinsByParent.get(call.parent_id) ?? []
    checkins.push(toCheckin(call, summariesByCall.get(call.id), observationsByCall.get(call.id) ?? [], alertsByCall.get(call.id) ?? []))
    checkinsByParent.set(call.parent_id, checkins)
  }

  return linkedParents.map((item) => {
    const recentCheckIns = checkinsByParent.get(item.parent.id) ?? []
    const latestCheckIn = recentCheckIns.find((checkin) => checkin.status === 'completed') ?? null
    return {
      id: item.parent.id,
      fullName: item.parent.full_name,
      relationship: item.relationship,
      preferredLanguage: item.parent.preferred_language,
      timezone: item.parent.timezone,
      lastCheckIn: latestCheckIn?.endedAt ?? null,
      latestCheckIn,
      recentCheckIns,
      schedule: schedulesByParent.get(item.parent.id) ?? null,
    }
  })
}

export interface CreateParentInput {
  fullName: string
  phoneNumber: string
  relationship: string
  preferredLanguage: string
  timezone: string
}

export async function createParent(input: CreateParentInput) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.rpc('create_parent_with_relationship', {
    parent_full_name: input.fullName.trim(),
    parent_phone_number: input.phoneNumber.trim(),
    relationship_name: input.relationship,
    parent_preferred_language: input.preferredLanguage,
    parent_timezone: input.timezone,
  })
  if (error) {
    if (import.meta.env.DEV) console.error('Supabase parent creation failed.', { code: error.code, message: error.message, details: error.details, hint: error.hint })
    throw new ParentCreationError(getParentCreationMessage(error), error)
  }
  return data
}
