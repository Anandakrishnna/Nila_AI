import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, Clock3, Languages, Phone, Plus, RefreshCw } from 'lucide-react'
import { AddParentDialog } from '@/components/add-parent-dialog'
import { CheckinIntelligence } from '@/components/checkin-intelligence'
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card'
import { Button } from '@/components/ui/button'
import { initiateCall } from '@/lib/calls'
import { getParents, type ParentRecord } from '@/lib/parents'

function formatLastCheckIn(value: string | null) {
  if (!value) return 'No check-ins yet'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatSchedule(parent: ParentRecord) {
  const schedule = parent.schedule
  if (!schedule) return 'No check-in schedule set'

  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(`1970-01-01T${schedule.localTime}Z`))

  if (schedule.frequency === 'daily') return `Daily at ${time}`
  const days = (schedule.daysOfWeek ?? [])
    .sort((left, right) => left - right)
    .map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
    .filter(Boolean)
  return `${days.length ? days.join(', ') : 'Weekly'} at ${time}`
}

function ParentCard({ parent, isCalling, onCall }: { parent: ParentRecord; isCalling: boolean; onCall: () => void }) {
  const callLabel = parent.relationship === 'Mother' ? 'Call Amma' : `Call ${parent.fullName.split(' ')[0]}`

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.035)]">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eef1f8] text-base font-semibold text-[#5268a5]">{parent.fullName.charAt(0).toUpperCase()}</span><div><p className="text-xs font-semibold tracking-[0.12em] text-[#5268a5]">PARENT OVERVIEW</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{parent.fullName}</h2><p className="mt-0.5 text-sm text-slate-500">Your {parent.relationship.toLowerCase()}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><Button asChild><Link to={`/voice-test?parent=${parent.id}`}>Start AI check-in <ArrowRight className="size-4" /></Link></Button><Button variant="outline" onClick={onCall} disabled={isCalling}><Phone className="size-4" /> {isCalling ? 'Starting call…' : callLabel}</Button></div></div>
        <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4"><div><dt className="flex items-center gap-2 text-xs font-medium text-slate-400"><Languages className="size-3.5" /> Preferred language</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{parent.preferredLanguage}</dd></div><div><dt className="flex items-center gap-2 text-xs font-medium text-slate-400"><Clock3 className="size-3.5" /> Timezone</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{parent.timezone}</dd></div><div><dt className="text-xs font-medium text-slate-400">Last check-in</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{formatLastCheckIn(parent.lastCheckIn)}</dd></div><div><dt className="flex items-center gap-2 text-xs font-medium text-slate-400"><CalendarClock className="size-3.5" /> Check-in schedule</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{formatSchedule(parent)}</dd></div></dl>
      </div>
      <CheckinIntelligence parent={parent} />
    </article>
  )
}

export function DashboardPage() {
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAddParentOpen, setIsAddParentOpen] = useState(false)
  const [callingParentId, setCallingParentId] = useState<string | null>(null)
  const [callMessage, setCallMessage] = useState<string | null>(null)

  const loadParents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      setParents(await getParents())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not load your family space.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadParents() }, [loadParents])

  async function handleCall(parent: ParentRecord) {
    setCallingParentId(parent.id)
    setCallMessage(null)
    try {
      const result = await initiateCall(parent.id)
      setCallMessage(`Nila is calling ${result.parentName}.`)
    } catch (error) {
      setCallMessage(error instanceof Error ? error.message : 'We could not start this call. Please try again.')
    } finally {
      setCallingParentId(null)
    }
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-[#5268a5]">Your family space</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">Keep the little things close.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">A private place for the people you care about and the moments they choose to share.</p></div><Button type="button" onClick={() => setIsAddParentOpen(true)}><Plus className="size-4" /> Add a parent</Button></div>
      <section className="mt-9">
        {isLoading && <LoadingState title="Opening your family space" description="Loading the people connected to your account." />}
        {!isLoading && errorMessage && <ErrorState title="We couldn’t load your family space" description="Please check your Supabase migration and try again." action={<Button variant="outline" onClick={() => void loadParents()}><RefreshCw className="size-4" /> Try again</Button>} />}
        {!isLoading && !errorMessage && parents.length === 0 && <EmptyState title="Start with someone you care about" description="Add a parent to create their private space. Conversations and check-ins will appear here only after they happen." action={<Button type="button" onClick={() => setIsAddParentOpen(true)}>Add a parent <ArrowRight className="size-4" /></Button>} />}
        {!isLoading && !errorMessage && parents.length > 0 && <div className="grid gap-5">{parents.map((parent) => <ParentCard key={parent.id} parent={parent} isCalling={callingParentId === parent.id} onCall={() => void handleCall(parent)} />)}</div>}
        {callMessage && <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600" role="status">{callMessage}</p>}
      </section>
      {isAddParentOpen && <AddParentDialog onClose={() => setIsAddParentOpen(false)} onCreated={() => void loadParents()} />}
    </div>
  )
}
