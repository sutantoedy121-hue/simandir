import { createClient } from '@/lib/supabase/server'
import DashboardOverview from '@/components/DashboardOverview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--neu-text)]">Dashboard</h1>
        <p className="text-[var(--neu-text-muted)] mt-1">Selamat datang kembali, {user?.email}</p>
      </div>
      <DashboardOverview />
    </div>
  )
}
