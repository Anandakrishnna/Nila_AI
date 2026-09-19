import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  compact?: boolean
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-[#5268a5] shadow-sm">
        <span className="size-3.5 rounded-full border-[3px] border-white" />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Nila</span>}
    </div>
  )
}
