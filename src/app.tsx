import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard-shell'
import { ErrorState } from '@/components/state-card'
import { DashboardPage } from '@/pages/dashboard-page'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage, SignupPage } from '@/pages/auth-pages'
import { VoiceTestPage } from '@/pages/voice-test-page'
import { AuthProvider } from '@/providers/auth-provider'
import { RequireAuth } from '@/routes/require-auth'

function NotFoundPage() {
  return <DashboardShell><ErrorState title="That page isn’t here" description="The page you were looking for may have moved." action={<a className="text-sm font-medium text-[#5268a5] hover:text-[#415582]" href="/">Back to Nila</a>} /></DashboardShell>
}

export function App() {
  return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /><Route element={<RequireAuth />}><Route path="/dashboard" element={<DashboardShell><DashboardPage /></DashboardShell>} /><Route path="/voice-test" element={<DashboardShell><VoiceTestPage /></DashboardShell>} /></Route><Route path="*" element={<NotFoundPage />} /><Route path="/home" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter>
}
