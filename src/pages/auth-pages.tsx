import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'signup'

function AuthPage({ mode }: { mode: AuthMode }) {
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const isSignup = mode === 'signup'
  const title = isSignup ? 'Create your family space' : 'Welcome back'
  const submitLabel = isSignup ? 'Create account' : 'Sign in'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setErrorMessage(null)

    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage('Supabase is not configured. Add the public project URL and publishable key, then restart Nila.')
      return
    }

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const fullName = String(form.get('fullName') ?? '').trim()

    setIsSubmitting(true)
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (error) throw error

        if (data.session) {
          navigate('/dashboard', { replace: true })
        } else {
          setNotice('Check your inbox to verify your email, then return here to sign in.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not complete that request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <AuthLayout><div className="w-full"><p className="text-sm font-medium text-[#5268a5]">Nila</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{isSignup ? 'Start building a calmer way to stay close.' : 'Sign in to your family space.'}</p><form className="mt-8 space-y-5" onSubmit={handleSubmit}>{isSignup && <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Your name</span><Input name="fullName" autoComplete="name" placeholder="Your name" required /></label>}<label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Email address</span><Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Password</span><Input name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" required minLength={8} /></label>{notice && <p className="rounded-xl border border-[#dfe5f3] bg-[#f4f6fb] px-3.5 py-3 text-sm leading-5 text-[#415582]" role="status">{notice}</p>}{errorMessage && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800" role="alert">{errorMessage}</p>}<Button type="submit" className="mt-2 w-full" size="lg" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : submitLabel}</Button></form><p className="mt-7 text-center text-sm text-slate-500">{isSignup ? 'Already have an account?' : 'New to Nila?'} <Link className="font-medium text-[#5268a5] hover:text-[#415582]" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p></div></AuthLayout>
}

export function LoginPage() { return <AuthPage mode="login" /> }
export function SignupPage() { return <AuthPage mode="signup" /> }
