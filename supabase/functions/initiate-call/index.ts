import { withSupabase } from 'npm:@supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const e164Pattern = /^\+[1-9]\d{7,14}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
}

interface ParentRow {
  id: string
  full_name: string
  phone_number: string
  preferred_language: string
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function readTwilioConfig(): TwilioConfig | null {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')?.trim()
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')?.trim()
  const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')?.trim()

  if (!accountSid || !authToken || !phoneNumber) return null
  return { accountSid, authToken, phoneNumber }
}

function xmlAttribute(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;',
  }[character] ?? character))
}

function mediaStreamUrl() {
  const projectUrl = Deno.env.get('SUPABASE_URL')
  if (!projectUrl) return null

  try {
    const url = new URL(projectUrl)
    if (!url.hostname.endsWith('.supabase.co')) return null
    return `wss://${url.hostname.replace(/\.supabase\.co$/, '.functions.supabase.co')}/twilio-media-stream`
  } catch {
    return null
  }
}

Deno.serve(withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  let parentId: string | undefined
  try {
    const body = await request.json()
    parentId = typeof body?.parentId === 'string' ? body.parentId : undefined
  } catch {
    return json({ error: 'The call request was not valid.' }, 400)
  }

  if (!parentId || !uuidPattern.test(parentId)) {
    return json({ error: 'The selected parent is not valid.' }, 400)
  }

  const { data: parent, error: parentError } = await context.supabase
    .from('parents')
    .select('id, full_name, phone_number, preferred_language')
    .eq('id', parentId)
    .maybeSingle<ParentRow>()

  if (parentError) {
    console.error('Could not verify parent access before initiating a call.', {
      code: parentError.code,
      message: parentError.message,
    })
    return json({ error: 'We could not verify access to this parent.' }, 500)
  }

  if (!parent) return json({ error: 'This parent is unavailable for calling.' }, 404)
  if (!e164Pattern.test(parent.phone_number)) {
    return json({ error: 'This parent has an invalid phone number.' }, 422)
  }

  const twilio = readTwilioConfig()
  if (!twilio) {
    console.error('Twilio configuration is incomplete for initiate-call.')
    return json({ error: 'Calling is not configured yet. Please try again later.' }, 503)
  }

  const streamUrl = mediaStreamUrl()
  if (!streamUrl) {
    console.error('Could not create the Twilio media-stream URL.')
    return json({ error: 'Calling is not configured yet. Please try again later.' }, 503)
  }

  const twiml = `<Response><Connect><Stream url="${xmlAttribute(streamUrl)}"><Parameter name="parent_name" value="${xmlAttribute(parent.full_name.slice(0, 400))}" /><Parameter name="preferred_language" value="${xmlAttribute(parent.preferred_language.slice(0, 100))}" /></Stream></Connect></Response>`

  const callsUrl = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilio.accountSid)}/Calls.json`
  console.info('Requesting Twilio outbound call.', {
    endpoint: 'Calls.json',
    usesConfiguredFromNumber: true,
    usesAuthorizedParentNumber: true,
  })

  let response: Response
  try {
    response = await fetch(
      callsUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${twilio.accountSid}:${twilio.authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: parent.phone_number,
          From: twilio.phoneNumber,
          Twiml: twiml,
        }),
      },
    )
  } catch {
    console.error('Could not connect to Twilio for an outbound call.')
    return json({ error: 'Nila could not reach the calling service. Please try again.' }, 502)
  }

  if (!response.ok) {
    let twilioError: { code?: number; message?: string } | null = null
    try {
      twilioError = await response.json()
    } catch {
      // Twilio responses are normally JSON, but only the HTTP status is needed here.
    }

    console.error('Twilio rejected the outbound call.', {
      status: response.status,
      code: twilioError?.code,
      message: twilioError?.message,
    })
    return json({
      error: 'Twilio could not start this call. Please check the number and try again.',
      twilio: {
        status: response.status,
        code: twilioError?.code ?? null,
        message: twilioError?.message ?? 'Twilio did not return a readable error message.',
      },
    }, 502)
  }

  console.info('Twilio outbound call accepted.', { status: response.status })

  return json({ status: 'initiated', parentName: parent.full_name })
}))
