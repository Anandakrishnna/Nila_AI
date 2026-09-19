import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  compact?: boolean
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-600 shadow-[0_8px_24px_rgba(124,92,255,0.38)]">
        <span className="size-3.5 rounded-full border-[3px] border-white/95" />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-[-0.04em]">Nila</span>}
    </div>
  )
}
