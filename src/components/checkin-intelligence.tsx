import { BellRing, CheckCircle2, Clock3, HeartHandshake, ListChecks, Sparkles, TrendingUp } from 'lucide-react'
import type { CheckinAlert, CheckinRecord, ParentRecord } from '@/lib/parents'

function formatCheckinTime(value: string | null) {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds < 1) return null
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (!minutes) return `${remainingSeconds}s conversation`
  return `${minutes}m${remainingSeconds ? ` ${remainingSeconds}s` : ''} conversation`
}

function followUps(checkin: CheckinRecord) {
  const alertItems = checkin.alerts.map((alert) => ({ text: alert.message, severity: alert.severity }))
  const seen = new Set(alertItems.map((item) => item.text.toLocaleLowerCase()))
  return [
    ...alertItems,
    ...checkin.followUpItems.filter((text) => !seen.has(text.toLocaleLowerCase())).map((text) => ({ text, severity: 'follow_up' as const })),
  ]
}

function FollowUpCard({ item }: { item: { text: string; severity: CheckinAlert['severity'] } }) {
  const urgent = item.severity === 'urgent'
  return (
    <div className={`rounded-xl border p-4 ${urgent ? 'border-rose-200 bg-rose-50/70' : 'border-amber-200 bg-amber-50/70'}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold ${urgent ? 'text-rose-800' : 'text-amber-900'}`}>
        <BellRing className="size-4" />
        {urgent ? 'Something needs attention' : 'Something to follow up on'}
      </div>
      <p className={`mt-2 text-sm leading-6 ${urgent ? 'text-rose-800' : 'text-amber-900'}`}>{item.text}</p>
    </div>
  )
}

function ObservationList({ checkin, compact = false }: { checkin: CheckinRecord; compact?: boolean }) {
  if (!checkin.observations.length) {
    return <p className="text-sm leading-6 text-slate-500">No specific details were saved from this conversation.</p>
  }

  return (
    <ul className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {checkin.observations.slice(0, compact ? 3 : 6).map((observation) => (
        <li key={observation.id} className="flex gap-2.5 text-sm leading-6 text-slate-700">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#5268a5]" aria-hidden="true" />
          <span>{observation.text}</span>
        </li>
      ))}
    </ul>
  )
}

function HighlightList({ checkin }: { checkin: CheckinRecord }) {
  const highlights = checkin.observations.slice(0, 3)
  if (!highlights.length) return null
  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">HIGHLIGHTS</p>
      <ul className="mt-3 space-y-1.5">
        {highlights.map((highlight) => <li key={highlight.id} className="text-sm leading-6 text-slate-700">• {highlight.text}</li>)}
      </ul>
    </div>
  )
}

function isToday(value: string | null) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

function callStatusLabel(status: string) {
  if (status === 'completed') return 'Completed'
  if (status === 'failed') return 'Did not complete'
  return status.replaceAll('_', ' ')
}

function TimelineItem({ checkin }: { checkin: CheckinRecord }) {
  const duration = formatDuration(checkin.durationSeconds)
  return (
    <li className="relative pl-7 before:absolute before:left-0 before:top-2 before:size-3 before:rounded-full before:border-[3px] before:border-[#dce3f5] before:bg-[#5268a5] after:absolute after:bottom-[-24px] after:left-[5px] after:top-5 after:w-px after:bg-slate-200 last:after:hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold text-slate-900">{formatCheckinTime(checkin.endedAt ?? checkin.createdAt)}</p>
        {duration && <p className="text-xs text-slate-400">{duration}</p>}
      </div>
      <p className={`mt-1 text-xs font-medium ${checkin.status === 'completed' ? 'text-[#5268a5]' : 'text-slate-500'}`}>{callStatusLabel(checkin.status)}</p>
      {checkin.overallTone && <p className="mt-1 text-xs font-medium text-[#5268a5]">{checkin.overallTone}</p>}
      {checkin.status === 'completed'
        ? <>{checkin.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{checkin.summary}</p> : <p className="mt-2 text-sm text-slate-500">This check-in completed without a saved summary.</p>}<div className="mt-3"><ObservationList checkin={checkin} compact /></div></>
        : <p className="mt-2 text-sm leading-6 text-slate-500">This check-in did not complete, so Nila did not save a summary.</p>}
    </li>
  )
}

function RecentConversations({ parent }: { parent: ParentRecord }) {
  if (!parent.recentCheckIns.length) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef1f8] text-[#5268a5]"><Clock3 className="size-4" /></span>
          <div><h3 className="text-sm font-semibold text-slate-900">No check-ins yet</h3><p className="mt-1 text-sm leading-6 text-slate-500">When {parent.fullName.split(' ')[0]} completes a check-in, its date, duration, and grounded summary will appear here.</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><Clock3 className="size-4 text-[#5268a5]" /><h3 className="text-sm font-semibold text-slate-900">Recent check-ins</h3></div><span className="text-xs text-slate-400">Most recent first</span></div>
      <ol className="mt-5 space-y-7">{parent.recentCheckIns.slice(0, 5).map((checkin) => <TimelineItem key={checkin.id} checkin={checkin} />)}</ol>
      {parent.recentCheckIns.length === 1 && <p className="mt-7 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500"><CheckCircle2 className="mr-2 inline size-4 text-[#5268a5]" />Future check-ins will gradually build a fuller picture—without guessing.</p>}
    </div>
  )
}

export function CheckinIntelligence({ parent }: { parent: ParentRecord }) {
  const latest = parent.latestCheckIn
  if (!latest) {
    return (
      <section className="border-t border-slate-100 bg-slate-50/45 px-5 py-6 sm:px-7 sm:py-7">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-6 sm:px-6">
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef1f8] text-[#5268a5]"><Sparkles className="size-4" /></span><div><h3 className="font-semibold text-slate-900">Ready for the first check-in</h3><p className="mt-1 text-sm leading-6 text-slate-500">After {parent.fullName} completes a voice check-in, Nila will save only the meaningful details they chose to share.</p></div></div>
        </div>
        <RecentConversations parent={parent} />
      </section>
    )
  }

  const latestFollowUps = followUps(latest)
  const conversationLabel = isToday(latest.endedAt ?? latest.createdAt) ? 'TODAY’S CONVERSATION' : 'LATEST CONVERSATION'
  return (
    <section className="border-t border-slate-100 bg-slate-50/45 px-5 py-6 sm:px-7 sm:py-7">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#5268a5]"><HeartHandshake className="size-4" /> {conversationLabel}</p><h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">A little closer to {parent.fullName.split(' ')[0]}’s day</h3></div>
            <div className="text-right text-xs text-slate-400"><p>{formatCheckinTime(latest.endedAt)}</p>{formatDuration(latest.durationSeconds) && <p className="mt-1">{formatDuration(latest.durationSeconds)}</p>}</div>
          </div>
          {latest.overallTone && <p className="mt-4 inline-flex rounded-full border border-[#dce3f5] bg-white px-2.5 py-1 text-xs font-medium text-[#465b97]">{latest.overallTone}</p>}
          <p className="mt-4 text-sm leading-7 text-slate-700">{latest.summary ?? 'This check-in completed without a saved summary.'}</p>
          <HighlightList checkin={latest} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#5268a5]"><ListChecks className="size-4" /> WHAT YOU MISSED</p>
          <div className="mt-4"><ObservationList checkin={latest} /></div>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] sm:p-6">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#5268a5]"><BellRing className="size-4" /> FOLLOW-UP</p>
        {latestFollowUps.length > 0
          ? <div className="mt-4 grid gap-3 md:grid-cols-2">{latestFollowUps.slice(0, 2).map((item) => <FollowUpCard key={`${item.severity}-${item.text}`} item={item} />)}</div>
          : <p className="mt-3 text-sm leading-6 text-slate-500">No follow-up items were saved from this check-in.</p>}
      </section>

      <section className="mt-4 rounded-2xl border border-[#dce3f5] bg-[#f7f8fc] p-5 sm:px-6"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[#5268a5]"><TrendingUp className="size-4" /> HISTORICAL CONTEXT</p>{latest.historicalChange ? <p className="mt-3 text-sm leading-6 text-slate-700">{latest.historicalChange}</p> : <p className="mt-3 text-sm leading-6 text-slate-500">Nila will surface changes only when they are supported by more than one conversation.</p>}</section>

      <RecentConversations parent={parent} />
    </section>
  )
}
