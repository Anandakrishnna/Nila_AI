import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[#fafaff] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-16 top-24 size-100 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-120 rounded-full bg-indigo-400/15 blur-3xl" />
        <BrandMark className="relative" />
        <div className="relative my-auto max-w-md"><p className="mb-6 text-sm font-medium tracking-[0.16em] text-violet-200 uppercase">A little closer</p><h1 className="text-5xl font-semibold tracking-[-0.055em] text-balance">Make every conversation count.</h1><p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">A quieter way to hold onto the everyday moments that bring a family together.</p></div>
        <p className="relative text-sm text-slate-500">AI handles the continuity. Humans handle the connection.</p>
      </section>
      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between"><Link to="/" className="text-slate-950 lg:hidden"><BrandMark /></Link><Link to="/" className="ml-auto inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-950"><ArrowLeft className="size-4" /> Back to home</Link></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center">{children}</div>
      </section>
    </main>
  )
}
