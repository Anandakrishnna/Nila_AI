import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="hidden border-r border-slate-200 bg-[#f7f8fc] p-12 lg:flex lg:flex-col">
        <BrandMark />
        <div className="my-auto max-w-md"><p className="mb-6 text-sm font-medium tracking-[0.14em] text-[#5268a5] uppercase">A little closer</p><h1 className="text-5xl font-semibold tracking-[-0.055em] text-balance text-slate-900">Make every conversation count.</h1><p className="mt-6 max-w-sm text-lg leading-8 text-slate-600">A quieter way to hold onto the everyday moments that bring a family together.</p></div>
        <p className="text-sm text-slate-400">AI handles the continuity. Humans handle the connection.</p>
      </section>
      <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between"><Link to="/" className="text-slate-950 lg:hidden"><BrandMark /></Link><Link to="/" className="ml-auto inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-950"><ArrowLeft className="size-4" /> Back to home</Link></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center">{children}</div>
      </section>
    </main>
  )
}
