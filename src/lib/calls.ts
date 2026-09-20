import { supabase } from '@/lib/supabase'

interface InitiateCallResponse {
  status: 'initiated'
  parentName: string
}

interface TwilioFailure {
  status?: number | null
  code?: number | null
  message?: string | null
}

interface FunctionFailure {
  error?: unknown
  twilio?: TwilioFailure
}

async function functionErrorDetails(error: unknown): Promise<{ message: string | null; twilio: TwilioFailure | null }> {
  const context = (error as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return { message: null, twilio: null }
  try {
    const body = await context.clone().json() as FunctionFailure
    return {
      message: typeof body.error === 'string' ? body.error : null,
      twilio: body.twilio ?? null,
    }
  } catch {
    return { message: null, twilio: null }
  }
}

function callFailureMessage(message: string | null, twilio: TwilioFailure | null) {
  if (twilio?.code === 20003) return 'Twilio rejected the account credentials. Re-save the Account SID and Auth Token for the new Twilio account, then try again.'
  if (twilio?.code === 21212) return 'Twilio rejected the caller number. Confirm TWILIO_PHONE_NUMBER is a voice-capable number from this Twilio account.'
  if (twilio?.code === 21211) return 'Twilio rejected this parent’s phone number. Confirm it uses the full international format, such as +91….'
  return message || 'We could not start this call. Please try again.'
}

export async function initiateCall(parentId: string): Promise<InitiateCallResponse> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke<InitiateCallResponse>('initiate-call', {
    body: { parentId },
  })

  if (error) {
    const details = await functionErrorDetails(error)
    if (import.meta.env.DEV) console.error('Supabase initiate-call function failed.', { error, message: details.message, twilio: details.twilio })
    throw new Error(callFailureMessage(details.message, details.twilio))
  }

  if (!data || data.status !== 'initiated') {
    throw new Error('We could not start this call. Please try again.')
  }

  return data
}
