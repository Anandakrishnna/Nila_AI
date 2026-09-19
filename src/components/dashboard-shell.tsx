import { Menu, PanelLeftClose, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [{ label: 'Home', to: '/dashboard' }]

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-slate-200/70 bg-white p-5 transition-transform duration-300 lg:translate-x-0', isOpen && 'translate-x-0')}>
        <div className="flex items-center justify-between">
          <BrandMark />
          <button aria-label="Close navigation" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setIsOpen(false)}><PanelLeftClose className="size-4" /></button>
        </div>
        <nav className="mt-12 space-y-1" aria-label="Dashboard">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setIsOpen(false)} className={({ isActive }) => cn('flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950')}>
              <span className="mr-3 size-2 rounded-full bg-current opacity-60" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-slate-950 p-4 text-white">
          <Sparkles className="size-4 text-violet-300" />
          <p className="mt-3 text-sm font-medium">Connection, kept close.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Nila keeps space for the moments that matter.</p>
        </div>
      </aside>
      <div className="min-h-screen lg:pl-72">
        <header className="flex h-18 items-center justify-between border-b border-slate-200/70 bg-white/75 px-5 backdrop-blur lg:h-20 lg:px-10">
          <button aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setIsOpen(true)}><Menu className="size-5" /></button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-950">Your family space</p><p className="mt-0.5 text-xs text-slate-400">A calmer way to stay close</p></div>
          <div className="ml-auto flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">Welcome to Nila</span><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-xs font-semibold text-violet-700">N</span></div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
