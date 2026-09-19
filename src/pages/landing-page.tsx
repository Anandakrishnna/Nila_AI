import { ArrowRight, HeartHandshake, MessageCircleMore, ShieldCheck } from 'lucide-react'
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
    <main className="overflow-hidden bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"><BrandMark /><div className="flex items-center gap-5"><Link to="/login" className="hidden text-sm text-slate-600 transition-colors hover:text-slate-950 sm:inline">Sign in</Link><Button asChild size="sm"><Link to="/signup">Get Started <ArrowRight className="size-4" /></Link></Button></div></div>
      </header>
      <section className="border-b border-slate-200 bg-[#fbfbfc]">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-18 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-10 lg:py-28">
          <div><p className="text-sm font-medium tracking-[0.12em] text-[#5268a5] uppercase">A little closer, even from miles away</p><h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-balance text-slate-900 sm:text-6xl lg:text-7xl">Distance shouldn&apos;t mean missing the little things.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Nila helps families stay connected through regular AI conversations with elderly parents and meaningful context for the people who care about them.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Button asChild size="lg"><Link to="/signup">Get Started <ArrowRight className="size-4" /></Link></Button><span className="text-sm text-slate-500">Connection, not replacement.</span></div></div>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.045)]"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-800">A gentler way to stay close</p><p className="mt-1 text-xs text-slate-500">Made for everyday connection</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#eef1f8] text-[#5268a5]"><HeartHandshake className="size-5" /></span></div><div className="my-11 flex h-18 items-center justify-center gap-1.5" aria-hidden="true">{[18, 38, 26, 54, 34, 64, 41, 25, 49, 30, 19].map((height, index) => <span key={index} className="w-1.5 rounded-full bg-[#6078b5]" style={{ height, opacity: index % 2 === 0 ? 0.5 : 0.85 }} />)}</div><div className="border-t border-slate-100 pt-5"><p className="text-sm font-medium text-slate-800">A space for what matters</p><p className="mt-1.5 text-sm leading-6 text-slate-500">Nila is designed to keep the conversation going—so you can stay present in the ways only family can.</p></div></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-22 sm:px-8 lg:px-10"><div className="max-w-xl"><p className="text-sm font-medium text-[#5268a5]">Designed around real connection</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">Less distance in the everyday.</h2><p className="mt-4 text-base leading-7 text-slate-500">Nila brings calm continuity to the moments between family calls—always leaving the relationship in human hands.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{principles.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.025)]"><span className="grid size-11 place-items-center rounded-xl bg-[#eef1f8] text-[#5268a5]"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article>)}</div></section>
      <section className="px-5 pb-8 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl border border-[#dce3f2] bg-[#f4f6fb] px-7 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-3xl font-semibold tracking-[-0.045em] text-slate-900">Closer starts with a hello.</h2><p className="mt-2 text-slate-600">Build a family space that has room for the little things.</p></div><Button asChild size="lg"><Link to="/signup">Create your space <ArrowRight className="size-4" /></Link></Button></div></section>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-sm text-slate-400 sm:px-8 lg:px-10"><BrandMark compact /><span>© {new Date().getFullYear()} Nila</span></footer>
    </main>
  )
}
