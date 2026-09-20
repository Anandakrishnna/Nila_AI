import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mic, MicOff, PhoneOff, Sparkles } from 'lucide-react'
import { abandonCheckin, completeCheckin, createRealtimeSession, type CheckinResult, type TranscriptEntry } from '@/lib/checkins'
import { RealtimeTransport, type VoiceStatus } from '@/lib/realtime-transport'
import { getParents, type ParentRecord } from '@/lib/parents'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingState } from '@/components/state-card'

const statusCopy: Record<VoiceStatus, string> = {
  idle: 'Ready to start', connecting: 'Connecting…', listening: 'Conversation active', thinking: 'Nila is preparing a reply…', finishing: 'Wrapping up your check-in…', ended: 'Check-in complete', error: 'Connection issue',
}

export function VoiceTestPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedParentId, setSelectedParentId] = useState(searchParams.get('parent') ?? '')
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const transport = useRef<RealtimeTransport | null>(null)
  const transcript = useRef<TranscriptEntry[]>([])
  const startedAt = useRef<number | null>(null)
  const activeCallId = useRef<string | null>(null)
  const isStarting = useRef(false)
  const isEnding = useRef(false)

  const loadParents = useCallback(async () => {
    setIsLoading(true)
    try { setParents(await getParents()) } catch { setError('We could not load your family members.') } finally { setIsLoading(false) }
  }, [])
  useEffect(() => { void loadParents() }, [loadParents])
  useEffect(() => () => {
    transport.current?.stop()
    const callId = activeCallId.current
    activeCallId.current = null
    if (callId) void abandonCheckin(callId)
  }, [])

  const selectedParent = parents.find((parent) => parent.id === selectedParentId)
  const isConversationActive = ['connecting', 'listening', 'thinking'].includes(status)
  const isFinishing = status === 'finishing'

  async function start() {
    if (isStarting.current || isEnding.current || transport.current) return
    if (!selectedParentId) return setError('Choose someone for this check-in first.')
    isStarting.current = true
    setError(null); setResult(null); transcript.current = []; setIsMuted(false); setStatus('connecting')
    let sessionCallId: string | null = null
    try {
      const session = await createRealtimeSession(selectedParentId)
      sessionCallId = session.callId
      activeCallId.current = session.callId
      const nextTransport = new RealtimeTransport()
      transport.current = nextTransport
      startedAt.current = Date.now()
      await nextTransport.start({ clientSecret: session.clientSecret, onStatus: setStatus, onTranscript: (entry) => { transcript.current.push(entry) }, onError: (message) => {
        if (isEnding.current) return
        if (transport.current === nextTransport) {
          nextTransport.stop()
          transport.current = null
          if (activeCallId.current === session.callId) activeCallId.current = null
          void abandonCheckin(session.callId)
        }
        setError(message)
        setStatus('error')
      } })
    } catch (cause) {
      transport.current?.stop(); transport.current = null
      if (sessionCallId && activeCallId.current === sessionCallId) {
        activeCallId.current = null
        void abandonCheckin(sessionCallId)
      }
      setStatus('error')
      setError(cause instanceof Error ? cause.message : 'We could not start the voice check-in.')
    } finally { isStarting.current = false }
  }

  async function end() {
    if (isEnding.current || !transport.current) return
    isEnding.current = true
    const activeTransport = transport.current
    const callId = activeCallId.current
    setStatus('finishing')
      const finalized = await activeTransport.end()
      if (transport.current === activeTransport) transport.current = null
      if (!finalized) {
        if (callId) await abandonCheckin(callId)
        activeCallId.current = null
        setStatus('error')
        setError('The conversation did not finish closing. Nothing was saved—please try another check-in.')
        return
      }
    const durationSeconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
    try {
      if (!transcript.current.some((entry) => entry.role === 'user')) {
        if (callId) await abandonCheckin(callId)
        activeCallId.current = null
        setStatus('error'); setError('No spoken response was captured, so Nila did not save a check-in.')
        return
      }
      if (!callId) throw new Error('This check-in could not be finalised. Please start another conversation.')
      const completed = await completeCheckin(selectedParentId, callId, transcript.current, durationSeconds)
      activeCallId.current = null
      setResult(completed); setStatus('ended')
    } catch (cause) {
      if (callId) void abandonCheckin(callId)
      activeCallId.current = null
      setStatus('error'); setError(cause instanceof Error ? cause.message : 'We could not save this check-in.')
    } finally {
      isEnding.current = false
      startedAt.current = null
    }
  }

  function toggleMute() {
    const nextMuted = !isMuted
    transport.current?.setMuted(nextMuted)
    setIsMuted(nextMuted)
  }

  if (isLoading) return <LoadingState title="Preparing the check-in" description="Loading the people in your family space." />
  if (!parents.length) return <EmptyState title="Add someone before starting" description="A voice check-in needs a parent profile." action={<Link className="text-sm font-medium text-[#5268a5]" to="/dashboard">Back to dashboard</Link>} />

  return <div className="mx-auto max-w-3xl animate-in fade-in duration-500">
    <Link to="/dashboard" className="text-sm font-medium text-[#5268a5] hover:text-[#415582]">← Back to dashboard</Link>
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-10 sm:py-11">
      <p className="text-sm font-medium text-[#5268a5]">Nila voice check-in</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">Checking in with {selectedParent?.fullName.split(' ')[0] || 'someone you love'}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">A private conversation, in your own words. Nila identifies itself as AI and saves only a grounded summary after you end the check-in.</p>
      <label className="mt-7 block max-w-sm"><span className="mb-2 block text-sm font-medium text-slate-700">Who is this check-in for?</span><select value={selectedParentId} disabled={isConversationActive || isFinishing} onChange={(event) => { setSelectedParentId(event.target.value); setSearchParams({ parent: event.target.value }) }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#6078b5] focus:ring-4 focus:ring-[#e9edf7]"><option value="" disabled>Select a parent</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.fullName} · {parent.relationship}</option>)}</select></label>
      <div className="mt-10 flex flex-col items-center text-center"><div className={`grid size-32 place-items-center rounded-full border transition-all duration-500 sm:size-40 ${isConversationActive || isFinishing ? 'border-[#cbd4ee] bg-[#f5f7fc] shadow-[0_0_0_16px_rgba(82,104,165,0.05)]' : 'border-slate-200 bg-slate-50'}`}><div className="grid size-20 place-items-center rounded-full bg-white text-[#5268a5] shadow-sm sm:size-24"><Sparkles className="size-7 sm:size-8" /></div></div><div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-700"><Mic className="size-4 text-[#5268a5]" />{statusCopy[status]}</div><p className="mt-2 text-sm text-slate-500">{isConversationActive ? 'Speak naturally. You can interrupt Nila at any time.' : isFinishing ? 'Nila is safely saving the details you chose to share.' : 'Start when you are ready.'}</p></div>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">{isFinishing ? <Button type="button" size="lg" disabled>Wrapping up your check-in…</Button> : !isConversationActive ? <Button type="button" onClick={() => void start()} disabled={!selectedParentId}><Mic className="size-4" /> Start conversation</Button> : <><Button type="button" variant="outline" onClick={toggleMute}>{isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{isMuted ? 'Unmute' : 'Mute'}</Button><Button type="button" variant="dark" size="lg" className="min-w-44" onClick={() => void end()}><PhoneOff className="size-4" /> End Check-in</Button></>}</div>
      {error && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert"><p>{error}</p><Link className="mt-2 inline-block font-medium text-[#465b97] hover:text-[#354777]" to="/dashboard">Return to dashboard</Link></div>}
      {result && <section className="mt-9 border-t border-slate-100 pt-8"><p className="text-xs font-semibold tracking-[0.14em] text-[#5268a5]">WHAT YOU MISSED</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{result.overallTone || 'Latest check-in'}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{result.summary}</p>{result.highlights.length > 0 && <ul className="mt-5 space-y-2 text-sm text-slate-700">{result.highlights.map((item) => <li key={item}>• {item}</li>)}</ul>}{result.historicalChange && <p className="mt-5 rounded-xl border border-[#dbe2f2] bg-[#f7f8fc] px-4 py-3 text-sm text-slate-700">{result.historicalChange}</p>}{result.followUpItems.length > 0 && <div className="mt-5"><p className="text-sm font-medium text-slate-800">Something to follow up on</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{result.followUpItems.map((item) => <li key={item}>• {item}</li>)}</ul></div>}<Button asChild className="mt-6"><Link to="/dashboard">View dashboard</Link></Button></section>}
    </div>
  </div>
}
