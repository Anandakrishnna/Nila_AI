import { withSupabase } from 'npm:@supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const categories = ['mood', 'activities', 'food', 'sleep', 'social_interaction', 'comfort', 'concerns', 'important_mention'] as const
type Category = typeof categories[number]

interface TranscriptItem { role: 'user' | 'assistant'; text: string }
interface Extraction {
  overall_tone: string | null
  summary: string
  highlights: string[]
  follow_up_items: string[]
  observations: Array<{ category: Category; text: string; source_excerpt: string }>
  urgency: 'normal' | 'follow_up' | 'urgent'
  urgent_message: string | null
  historical_change: string | null
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function sanitizeTranscript(value: unknown): TranscriptItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null
  const result: TranscriptItem[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const role = (item as { role?: unknown }).role
    const text = (item as { text?: unknown }).text
    if ((role !== 'user' && role !== 'assistant') || typeof text !== 'string') return null
    const trimmed = text.trim()
    if (trimmed && trimmed.length <= 2000) result.push({ role, text: trimmed })
  }
  return result.some((item) => item.role === 'user') ? result : null
}

function textItems(value: unknown, maximumItems: number, maximumLength: number) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maximumLength))
    .filter(Boolean)
    .slice(0, maximumItems)
}

function responseText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text
  const output = response.output
  if (!Array.isArray(output)) return null
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') return (part as { text: string }).text
    }
  }
  return null
}

async function failCheckin(context: { supabase: { from: (table: 'calls') => any } }, callId: string) {
  await context.supabase.from('calls')
    .update({ status: 'failed', failure_reason: 'The check-in could not be processed.' })
    .eq('id', callId)
    .eq('status', 'in_progress')
}

const extractionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    overall_tone: { type: ['string', 'null'] }, summary: { type: 'string' }, highlights: { type: 'array', items: { type: 'string' } },
    follow_up_items: { type: 'array', items: { type: 'string' } },
    observations: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { category: { type: 'string', enum: categories }, text: { type: 'string' }, source_excerpt: { type: 'string' } }, required: ['category', 'text', 'source_excerpt'] } },
    urgency: { type: 'string', enum: ['normal', 'follow_up', 'urgent'] }, urgent_message: { type: ['string', 'null'] }, historical_change: { type: ['string', 'null'] },
  },
  required: ['overall_tone', 'summary', 'highlights', 'follow_up_items', 'observations', 'urgency', 'urgent_message', 'historical_change'],
}

Deno.serve(withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  let body: { action?: unknown; parentId?: unknown; callId?: unknown; transcript?: unknown; durationSeconds?: unknown }
  try { body = await request.json() } catch { return json({ error: 'The check-in result was not valid.' }, 400) }
  const callId = typeof body.callId === 'string' && uuidPattern.test(body.callId) ? body.callId : null
  if (!callId) return json({ error: 'The check-in result was not valid.' }, 400)

  if (body.action === 'abandon') {
    await failCheckin(context, callId)
    return json({ status: 'abandoned' })
  }

  const parentId = typeof body.parentId === 'string' ? body.parentId : null
  const transcript = sanitizeTranscript(body.transcript)
  const durationSeconds = typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds) ? Math.max(0, Math.min(Math.round(body.durationSeconds), 10_800)) : 0
  if (!parentId || !uuidPattern.test(parentId) || !transcript) return json({ error: 'The check-in result was not valid.' }, 400)

  const { data: parent } = await context.supabase.from('parents').select('id, full_name').eq('id', parentId).maybeSingle()
  if (!parent) return json({ error: 'This parent is unavailable for a check-in.' }, 404)
  const { data: activeCall } = await context.supabase.from('calls').select('id').eq('id', callId).eq('parent_id', parent.id).eq('status', 'in_progress').maybeSingle()
  if (!activeCall) return json({ error: 'This check-in has already been finalised or is unavailable.' }, 409)

  const { data: previousObservations } = await context.supabase
    .from('observations')
    .select('category, observation_text, created_at')
    .eq('parent_id', parent.id)
    .order('created_at', { ascending: false })
    .limit(12)
  const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
  if (!apiKey) {
    await failCheckin(context, callId)
    return json({ error: 'Check-in summaries are not configured yet.' }, 503)
  }

  const transcriptText = transcript.map((item) => `${item.role === 'user' ? parent.full_name : 'Nila'}: ${item.text}`).join('\n')
  const historyText = (previousObservations ?? []).map((item) => `- ${item.observation_text}`).join('\n') || 'None.'
  const instructions = 'Extract only statements grounded in the transcript. Do not diagnose, prescribe, infer medical conditions, or add facts. Highlights and observations must be meaningful details the parent actually shared. An urgent classification requires direct evidence of an immediate serious concern; otherwise use follow_up or normal. A historical change must be supported by the provided earlier observations and current transcript; return null when there is no supported change.'

  let aiResponse: Response
  try {
    aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-5-mini', store: false, instructions, input: `Parent: ${parent.full_name}\n\nEarlier observations:\n${historyText}\n\nTranscript:\n${transcriptText}`, text: { format: { type: 'json_schema', name: 'nila_checkin', strict: true, schema: extractionSchema } } }),
    })
  } catch {
    await failCheckin(context, callId)
    return json({ error: 'Could not generate the check-in summary. Please try again.' }, 502)
  }
  if (!aiResponse.ok) {
    console.error('OpenAI rejected check-in extraction.', { status: aiResponse.status })
    await failCheckin(context, callId)
    return json({ error: 'Could not generate the check-in summary. Please try again.' }, 502)
  }

  let extraction: Extraction
  try { extraction = JSON.parse(responseText(await aiResponse.json() as Record<string, unknown>) ?? '') as Extraction } catch {
    await failCheckin(context, callId)
    return json({ error: 'Could not read the check-in summary. Please try again.' }, 502)
  }

  const summary = typeof extraction.summary === 'string' ? extraction.summary.trim().slice(0, 5000) : ''
  const highlights = textItems(extraction.highlights, 8, 500)
  const followUpItems = textItems(extraction.follow_up_items, 8, 500)
  const grounded = Array.isArray(extraction.observations) ? extraction.observations
    .filter((item) => categories.includes(item.category) && typeof item.text === 'string' && typeof item.source_excerpt === 'string')
    .map((item) => ({ category: item.category, observation_text: item.text.trim().slice(0, 2000), source_excerpt: item.source_excerpt.trim().slice(0, 2000) }))
    .filter((item) => item.observation_text && item.source_excerpt)
    .slice(0, 12) : []
  const historicalChange = previousObservations?.length && typeof extraction.historical_change === 'string' && extraction.historical_change.trim()
    ? extraction.historical_change.trim().slice(0, 2000)
    : null
  const alertSeverity = extraction.urgency === 'urgent' ? 'urgent' : extraction.urgency === 'follow_up' ? 'follow_up' : null
  const alertMessage = alertSeverity === 'urgent'
    ? typeof extraction.urgent_message === 'string' ? extraction.urgent_message.trim().slice(0, 2000) : null
    : followUpItems[0] ?? null
  if (!summary || !['normal', 'follow_up', 'urgent'].includes(extraction.urgency)) {
    await failCheckin(context, callId)
    return json({ error: 'Could not validate the check-in summary. Please try again.' }, 502)
  }

  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - durationSeconds * 1000)
  const { error: persistenceError } = await context.supabase.rpc('persist_completed_checkin', {
    p_call_id: callId,
    p_parent_id: parent.id,
    p_started_at: startedAt.toISOString(),
    p_ended_at: endedAt.toISOString(),
    p_duration_seconds: durationSeconds,
    p_overall_tone: typeof extraction.overall_tone === 'string' ? extraction.overall_tone.trim().slice(0, 80) || null : null,
    p_summary_text: summary,
    p_follow_up_text: followUpItems.join('\n') || null,
    p_historical_change_text: historicalChange,
    p_observations: grounded,
    p_alert_severity: alertSeverity,
    p_alert_message: alertMessage,
  })
  if (persistenceError) {
    console.error('Could not persist completed check-in.', { code: persistenceError.code })
    await failCheckin(context, callId)
    return json({ error: 'Could not save this check-in. Please try again.' }, 500)
  }

  return json({ status: 'completed', callId, overallTone: typeof extraction.overall_tone === 'string' ? extraction.overall_tone.trim().slice(0, 80) || null : null, summary, highlights, followUpItems, observations: grounded.map(({ category, observation_text, source_excerpt }) => ({ category, text: observation_text, source_excerpt })), historicalChange, urgency: extraction.urgency })
}))
