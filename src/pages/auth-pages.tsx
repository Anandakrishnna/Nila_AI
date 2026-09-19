import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured } from '@/lib/supabase'

type AuthMode = 'login' | 'signup'

function AuthPage({ mode }: { mode: AuthMode }) {
  const [notice, setNotice] = useState<string | null>(null)
  const isSignup = mode === 'signup'
  const title = isSignup ? 'Create your family space' : 'Welcome back'
  const submitLabel = isSignup ? 'Create account' : 'Sign in'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(isSupabaseConfigured ? 'Secure sign-in will be enabled in Milestone 2.' : 'Add your Supabase environment variables before authentication can be enabled.')
  }

  return <AuthLayout><div className="w-full"><p className="text-sm font-medium text-[#5268a5]">Nila</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{isSignup ? 'Start building a calmer way to stay close.' : 'Sign in to your family space.'}</p><form className="mt-8 space-y-5" onSubmit={handleSubmit}>{isSignup && <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Your name</span><Input autoComplete="name" placeholder="Your name" required /></label>}<label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Email address</span><Input type="email" autoComplete="email" placeholder="you@example.com" required /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Password</span><Input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" required minLength={8} /></label>{notice && <p className="rounded-xl border border-[#dfe5f3] bg-[#f4f6fb] px-3.5 py-3 text-sm leading-5 text-[#415582]" role="status">{notice}</p>}<Button type="submit" className="mt-2 w-full" size="lg">{submitLabel}</Button></form><p className="mt-7 text-center text-sm text-slate-500">{isSignup ? 'Already have an account?' : 'New to Nila?'} <Link className="font-medium text-[#5268a5] hover:text-[#415582]" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p><p className="mt-8 text-center text-xs leading-5 text-slate-400">Authentication is intentionally staged for the next milestone. No account is created from this screen yet.</p></div></AuthLayout>
}

export function LoginPage() { return <AuthPage mode="login" /> }
export function SignupPage() { return <AuthPage mode="signup" /> }
