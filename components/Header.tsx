'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarIcon,
  CheckSquareIcon,
  DollarSignIcon,
  TargetIcon,
  RepeatIcon,
  BookOpenIcon,
  FolderIcon,
  FileTextIcon,
  MessageSquareIcon,
  LogOutIcon,
  LayoutDashboardIcon,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Waktu', href: '/dashboard/time', icon: CalendarIcon },
  { name: 'Tugas', href: '/dashboard/tasks', icon: CheckSquareIcon },
  { name: 'Keuangan', href: '/dashboard/finance', icon: DollarSignIcon },
  { name: 'Kebiasaan', href: '/dashboard/habits', icon: RepeatIcon },
  { name: 'Target', href: '/dashboard/goals', icon: TargetIcon },
  { name: 'Catatan', href: '/dashboard/notes', icon: BookOpenIcon },
  { name: 'Proyek', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Jurnal', href: '/dashboard/journal', icon: FileTextIcon },
  { name: 'AI', href: '/dashboard/ai', icon: MessageSquareIcon },
]

export default function Header({ email }: { email?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 flex-shrink-0 bg-[var(--neu-bg)]/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 pt-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="neu-icon-circle w-8 h-8 text-sm font-bold text-[var(--neu-accent)]">
            S
          </span>
          <span className="text-lg font-semibold text-[var(--neu-text)]">SMD</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {email && (
            <span className="hidden truncate text-sm text-[var(--neu-text-muted)] sm:inline">
              {email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="neu-nav-item flex flex-shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium"
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-6 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`neu-nav-item flex flex-shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium ${
                isActive ? 'active' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
