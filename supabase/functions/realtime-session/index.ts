import { withSupabase } from 'npm:@supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function openAiErrorDetails(response: Response) {
  let type: string | null = null
  let code: string | null = null
  try {
    const body = await response.json() as { error?: { type?: unknown; code?: unknown } }
    type = typeof body.error?.type === 'string' ? body.error.type : null
    code = typeof body.error?.code === 'string' ? body.error.code : null
  } catch {
    // The HTTP status is still sufficient when OpenAI does not return JSON.
  }
  return { status: response.status, type, code }
}

function realtimeConfigurationMessage(status: number) {
  if (status === 401) return 'The server-side OpenAI API key was rejected. Update OPENAI_API_KEY in Supabase Edge Function secrets.'
  if (status === 403 || status === 404) return 'This OpenAI project does not have access to the Realtime model. Use a billed OpenAI API project with Realtime access.'
  if (status === 429) return 'This OpenAI project has no available Realtime API quota. Add billing or API credit, then try again.'
  if (status === 400) return 'The OpenAI Realtime session configuration was rejected. The server log includes the safe status and error code.'
  return 'The OpenAI voice service is temporarily unavailable. Please try again.'
}

async function safetyIdentifier(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function conciseContext(value: string | null | undefined, maximumLength = 360) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  if (!normalized) return null
  return normalized.length > maximumLength ? `${normalized.slice(0, maximumLength - 1)}…` : normalized
}

Deno.serve(withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  let parentId: string | undefined
  try {
    const body = await request.json()
    parentId = typeof body?.parentId === 'string' ? body.parentId : undefined
  } catch {
    return json({ error: 'The voice session request was not valid.' }, 400)
  }

  if (!parentId || !uuidPattern.test(parentId)) return json({ error: 'The selected parent is not valid.' }, 400)

  const { data: parent, error: parentError } = await context.supabase
    .from('parents')
    .select('id, full_name, preferred_language')
    .eq('id', parentId)
    .maybeSingle()

  if (parentError || !parent) return json({ error: 'This parent is unavailable for a check-in.' }, parentError ? 500 : 404)

  const [observationsResult, summariesResult, alertsResult] = await Promise.all([
    context.supabase
      .from('observations')
      .select('category, observation_text, created_at')
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(4),
    context.supabase
      .from('call_summaries')
      .select('summary_text, follow_up_text, historical_change_text, created_at')
      .eq('parent_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(2),
    context.supabase
      .from('alerts')
      .select('message, severity, created_at')
      .eq('parent_id', parent.id)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  if (observationsResult.error || summariesResult.error || alertsResult.error) {
    console.error('Could not load all prior check-in context.', {
      observations: observationsResult.error?.code ?? null,
      summaries: summariesResult.error?.code ?? null,
      alerts: alertsResult.error?.code ?? null,
    })
  }

  const priorContext = [
    ...(observationsResult.data ?? [])
      .map((item) => conciseContext(item.observation_text))
      .filter((item): item is string => Boolean(item))
      .map((item) => `Previous observation: ${item}`),
    ...(summariesResult.data ?? [])
      .flatMap((item) => [
        conciseContext(item.summary_text),
        conciseContext(item.follow_up_text),
        conciseContext(item.historical_change_text),
      ])
      .filter((item): item is string => Boolean(item))
      .map((item) => `Previous saved check-in note: ${item}`),
    ...(alertsResult.data ?? [])
      .map((item) => conciseContext(item.message))
      .filter((item): item is string => Boolean(item))
      .map((item) => `Unresolved follow-up: ${item}`),
  ].slice(0, 8).map((item) => `- ${item}`).join('\n')

  const instructions = [
    'You are Nila, a warm AI companion for older adults. Clearly identify yourself as an AI assistant.',
    `You are having a short, respectful check-in with ${parent.full_name}. Prefer ${parent.preferred_language || 'the language the person uses'}.`,
    'Be concise, patient, and natural. Start with a warm greeting and an open question about how they are today.',
    'The person’s most recent question, statement, or change of topic is always your first priority. Listen until their turn is complete, understand its intent, and respond directly before considering a new check-in topic.',
    'Treat a normal question as a conversation, not as a prompt to resume a script. If you do not understand, say so plainly and ask them to repeat or clarify; never invent an answer.',
    'Maintain context across turns. Do not repeat a question that was already answered or declined. Ask at most one relevant follow-up question at a time, and only if it flows naturally from what they just said.',
    'Gently explore sleep, food, activities, mood, social interaction, and comfort only when natural. These are optional topics, not a checklist or interrogation.',
    'Use saved context only when it is genuinely relevant. It is a short factual note, not a verbatim transcript. If asked about a past conversation and the needed detail is not in the saved context, explain that you only have the saved notes rather than pretending to remember.',
    'If the person interrupts you or changes topic, stop the previous line of questioning and respond to the new input naturally.',
    'Never claim to be a family member, diagnose illness, prescribe medication, recommend medication changes, or claim medical certainty.',
    'If the person describes an immediate serious concern, calmly encourage contacting a trusted person or seeking immediate medical help without diagnosing.',
    priorContext ? `Grounded prior context (use only if relevant, never present it as new information):\n${priorContext}` : 'There is no prior check-in context yet.',
  ].join('\n\n')

  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (!apiKey) {
    console.error('OpenAI configuration is incomplete for realtime-session.')
    return json({ error: 'Voice check-ins are not configured yet.' }, 503)
  }

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': await safetyIdentifier(parent.id),
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime-2.1',
          instructions,
          audio: {
            input: { transcription: { model: 'gpt-4o-mini-transcribe' } },
            output: { voice: 'marin' },
          },
        },
      }),
    })
  } catch {
    return json({ error: 'Could not connect to the voice service. Please try again.' }, 502)
  }

  if (!response.ok) {
    console.error('OpenAI rejected Realtime client-secret creation.', await openAiErrorDetails(response))
    return json({ error: realtimeConfigurationMessage(response.status) }, 502)
  }

  const result = await response.json() as { value?: string; expires_at?: number }
  if (!result.value) return json({ error: 'Could not start the voice session. Please try again.' }, 502)

  const { data: call, error: callError } = await context.supabase
    .from('calls')
    .insert({ parent_id: parent.id, status: 'in_progress', started_at: new Date().toISOString() })
    .select('id')
    .single()
  if (callError || !call) {
    console.error('Could not create the check-in record.', { code: callError?.code ?? null })
    return json({ error: 'Could not prepare this check-in. Please try again.' }, 500)
  }

  return json({ clientSecret: result.value, expiresAt: result.expires_at ?? null, callId: call.id })
}))
