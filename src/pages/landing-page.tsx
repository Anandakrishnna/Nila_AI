import { ArrowRight, Check, HeartHandshake, MessageCircleMore, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'

const principles = [
  { icon: MessageCircleMore, title: 'Small moments matter', description: 'Space for the everyday stories that are easy to miss from far away.' },
  { icon: ShieldCheck, title: 'Built with care', description: 'A respectful companion that keeps family connection at the center.' },
  { icon: HeartHandshake, title: 'A clearer way to show up', description: 'Helpful context for warmer, more meaningful human conversations.' },
]

export function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#fcfcfe] text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-125 w-175 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[110px]" />
        <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><BrandMark /><div className="flex items-center gap-3"><Link to="/login" className="hidden text-sm text-slate-300 transition-colors hover:text-white sm:inline">Sign in</Link><Button asChild size="sm"><Link to="/signup">Get Started <ArrowRight className="size-4" /></Link></Button></div></header>
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-17 sm:px-8 sm:pb-30 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-24">
          <div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-xs font-medium text-violet-100"><Sparkles className="size-3.5" /> A little closer, even from miles away</div><h1 className="mt-7 max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-balance sm:text-6xl lg:text-7xl">Distance shouldn&apos;t mean missing the little things.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">Nila helps families stay connected through regular AI conversations with elderly parents and meaningful context for the people who care about them.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Button asChild size="lg"><Link to="/signup">Get Started <ArrowRight className="size-4" /></Link></Button><span className="text-sm text-slate-400">Connection, not replacement.</span></div></div>
          <div className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm"><div className="rounded-[1.5rem] bg-gradient-to-b from-white to-violet-50 p-6 text-slate-950"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">A gentle bridge</p><p className="mt-1 text-xs text-slate-500">Made for everyday connection</p></div><span className="grid size-10 place-items-center rounded-2xl bg-violet-100 text-violet-600"><HeartHandshake className="size-5" /></span></div><div className="my-12 flex h-20 items-center justify-center gap-1.5" aria-hidden="true">{[18, 38, 26, 54, 34, 64, 41, 25, 49, 30, 19].map((height, index) => <span key={index} className="w-1.5 rounded-full bg-gradient-to-t from-violet-400 to-indigo-500" style={{ height }} />)}</div><div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><p className="text-sm font-medium">A space for what matters</p><p className="mt-1.5 text-sm leading-6 text-slate-600">Nila is designed to keep the conversation going—so you can stay present in the ways only family can.</p></div></div></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-22 sm:px-8 lg:px-10"><div className="max-w-xl"><p className="text-sm font-medium text-violet-600">Designed around real connection</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Less distance in the everyday.</h2><p className="mt-4 text-base leading-7 text-slate-500">Nila brings calm continuity to the moments between family calls—always leaving the relationship in human hands.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{principles.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"><span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article>)}</div></section>
      <section className="px-5 pb-8 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] bg-violet-600 px-7 py-10 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-3xl font-semibold tracking-[-0.045em]">Closer starts with a hello.</h2><p className="mt-2 text-violet-100">Build a family space that has room for the little things.</p></div><Button asChild variant="dark" size="lg"><Link to="/signup">Create your space <ArrowRight className="size-4" /></Link></Button></div></section>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-sm text-slate-400 sm:px-8 lg:px-10"><BrandMark compact /><span>© {new Date().getFullYear()} Nila</span></footer>
    </main>
  )
}
