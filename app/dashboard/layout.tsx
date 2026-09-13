import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import FloatingAIButton from '@/components/FloatingAIButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen flex-col">
      <Header email={user.email} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <FloatingAIButton />
      <footer className="neu-raised-sm flex-shrink-0 rounded-none border-t-0 px-6 py-3">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-[var(--neu-text-muted)] sm:flex-row">
          <p>SMD — Sistem Manajemen Diri</p>
          <p>Data Anda dilindungi Row Level Security</p>
        </div>
      </footer>
    </div>
  )
}
