import { Navigate, Outlet } from 'react-router-dom'
import { DashboardShell } from '@/components/dashboard-shell'
import { ErrorState, LoadingState } from '@/components/state-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

export function RequireAuth() {
  const { user, isLoading, isConfigured } = useAuth()

  if (isLoading) return <DashboardShell><LoadingState title="Opening your family space" description="Checking your secure session." /></DashboardShell>
  if (!isConfigured) return <DashboardShell><ErrorState title="Connect Supabase to continue" description="Add your public Supabase URL and publishable key to a local .env file." action={<Button asChild variant="outline"><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase</a></Button>} /></DashboardShell>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
