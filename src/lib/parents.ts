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
  if (error.code === 'PGRST202') {
    return 'We’re still setting up parent profiles. Please try again shortly.'
  }

  if (error.code === '23503') {
    return 'Your account setup is incomplete. Please sign out, sign in again, and try once more.'
  }

  return 'We could not save this parent. Please try again.'
}

export interface ParentRecord {
  id: string
  fullName: string
  relationship: string
  preferredLanguage: string
  timezone: string
  lastCheckIn: string | null
}

interface ParentJoin {
  id: string
  full_name: string
  preferred_language: string
  timezone: string
  calls: Array<{ ended_at: string | null; status: string }>
}

interface RelationshipJoin {
  relationship: string
  parent: ParentJoin | null
}

function getLatestCheckIn(calls: ParentJoin['calls']) {
  return calls
    .filter((call) => call.status === 'completed' && call.ended_at)
    .sort((left, right) => new Date(right.ended_at!).getTime() - new Date(left.ended_at!).getTime())[0]?.ended_at ?? null
}

export async function getParents(): Promise<ParentRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('parent_relationships')
    .select('relationship, parent:parents(id, full_name, preferred_language, timezone, calls(status, ended_at))')
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as RelationshipJoin[])
    .filter((item): item is RelationshipJoin & { parent: ParentJoin } => item.parent !== null)
    .map((item) => ({
      id: item.parent.id,
      fullName: item.parent.full_name,
      relationship: item.relationship,
      preferredLanguage: item.parent.preferred_language,
      timezone: item.parent.timezone,
      lastCheckIn: getLatestCheckIn(item.parent.calls ?? []),
    }))
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
    if (import.meta.env.DEV) {
      console.error('Supabase parent creation failed.', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
    }

    throw new ParentCreationError(getParentCreationMessage(error), error)
  }
  return data
}
