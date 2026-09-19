import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Clock3, Languages, Phone, Plus, RefreshCw } from 'lucide-react'
import { AddParentDialog } from '@/components/add-parent-dialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card'
import { Button } from '@/components/ui/button'
import { getParents, type ParentRecord } from '@/lib/parents'

function formatLastCheckIn(value: string | null) {
  if (!value) return 'No check-ins yet'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ParentCard({ parent }: { parent: ParentRecord }) {
  const callLabel = parent.relationship === 'Mother' ? 'Call Amma' : `Call ${parent.fullName.split(' ')[0]}`

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#eef1f8] text-base font-semibold text-[#5268a5]">{parent.fullName.charAt(0).toUpperCase()}</span><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">{parent.fullName}</h2><p className="mt-0.5 text-sm text-slate-500">Your {parent.relationship.toLowerCase()}</p></div></div><Button variant="outline" disabled title="Calling will be available in the next milestone"><Phone className="size-4" /> {callLabel}</Button></div>
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3"><div><dt className="flex items-center gap-2 text-xs font-medium text-slate-400"><Languages className="size-3.5" /> Preferred language</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{parent.preferredLanguage}</dd></div><div><dt className="flex items-center gap-2 text-xs font-medium text-slate-400"><Clock3 className="size-3.5" /> Timezone</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{parent.timezone}</dd></div><div><dt className="text-xs font-medium text-slate-400">Last check-in</dt><dd className="mt-1.5 text-sm font-medium text-slate-700">{formatLastCheckIn(parent.lastCheckIn)}</dd></div></dl>
    </article>
  )
}

export function DashboardPage() {
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAddParentOpen, setIsAddParentOpen] = useState(false)

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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-[#5268a5]">Your family space</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">Keep the little things close.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">A private place for the people you care about and the moments they choose to share.</p></div><Button type="button" onClick={() => setIsAddParentOpen(true)}><Plus className="size-4" /> Add a parent</Button></div>
      <section className="mt-9">
        {isLoading && <LoadingState title="Opening your family space" description="Loading the people connected to your account." />}
        {!isLoading && errorMessage && <ErrorState title="We couldn’t load your family space" description="Please check your Supabase migration and try again." action={<Button variant="outline" onClick={() => void loadParents()}><RefreshCw className="size-4" /> Try again</Button>} />}
        {!isLoading && !errorMessage && parents.length === 0 && <EmptyState title="Start with someone you care about" description="Add a parent to create their private space. Conversations and check-ins will appear here only after they happen." action={<Button type="button" onClick={() => setIsAddParentOpen(true)}>Add a parent <ArrowRight className="size-4" /></Button>} />}
        {!isLoading && !errorMessage && parents.length > 0 && <div className="grid gap-5">{parents.map((parent) => <ParentCard key={parent.id} parent={parent} />)}</div>}
      </section>
      {isAddParentOpen && <AddParentDialog onClose={() => setIsAddParentOpen(false)} onCreated={() => void loadParents()} />}
    </div>
  )
}
