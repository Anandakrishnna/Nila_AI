import type { ReactNode } from 'react'
import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StateCardProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: StateCardProps) {
  return (
    <section className="grid min-h-75 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#eef1f8] text-[#5268a5]"><Inbox className="size-5" /></span>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </section>
  )
}

export function LoadingState({ title = 'Getting things ready', description = 'This will only take a moment.' }: Partial<StateCardProps>) {
  return (
    <section className="grid min-h-75 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div>
        <LoaderCircle className="mx-auto size-7 animate-spin text-[#5268a5]" />
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </section>
  )
}

export function ErrorState({ title, description, action }: StateCardProps) {
  return (
    <section className="grid min-h-75 place-items-center rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><CircleAlert className="size-5" /></span>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {action ?? <div className="mt-5"><Button variant="outline">Try again</Button></div>}
      </div>
    </section>
  )
}
