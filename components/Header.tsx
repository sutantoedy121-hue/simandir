'use client'

import { useEffect, useRef, useState } from 'react'
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
  MenuIcon,
  XIcon,
} from 'lucide-react'

const navigation = [
  { name: 'AI', href: '/dashboard/ai', icon: MessageSquareIcon },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Waktu', href: '/dashboard/time', icon: CalendarIcon },
  { name: 'Tugas', href: '/dashboard/tasks', icon: CheckSquareIcon },
  { name: 'Keuangan', href: '/dashboard/finance', icon: DollarSignIcon },
  { name: 'Kebiasaan', href: '/dashboard/habits', icon: RepeatIcon },
  { name: 'Target', href: '/dashboard/goals', icon: TargetIcon },
  { name: 'Catatan', href: '/dashboard/notes', icon: BookOpenIcon },
  { name: 'Proyek', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Jurnal', href: '/dashboard/journal', icon: FileTextIcon },
]

const FOKUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neu-accent)]'

export default function Header({ email }: { email?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [buka, setBuka] = useState(false)
  const wadahRef = useRef<HTMLDivElement>(null)

  const aktif = navigation.find((item) => item.href === pathname)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  // Rute berubah -> panel tidak relevan lagi.
  useEffect(() => {
    setBuka(false)
  }, [pathname])

  // Escape menutup, dan klik di luar wadah menutup. Listener hanya dipasang
  // saat panel terbuka, jadi tidak ada biaya ketika tertutup.
  useEffect(() => {
    if (!buka) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuka(false)
    }
    const onClick = (e: MouseEvent) => {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setBuka(false)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [buka])

  return (
    <header className="sticky top-0 z-50 flex-shrink-0 bg-[var(--neu-bg)]/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Link href="/dashboard" className={`flex items-center gap-2 rounded-lg ${FOKUS}`}>
          <span className="neu-icon-circle w-8 h-8 text-sm font-bold text-[var(--neu-accent)]">
            S
          </span>
          <span className="text-lg font-semibold text-[var(--neu-text)]">SMD</span>
        </Link>

        <div ref={wadahRef} className="relative flex items-center gap-3">
          <button
            onClick={() => setBuka((v) => !v)}
            aria-expanded={buka}
            aria-haspopup="true"
            className={`neu-nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium ${FOKUS}`}
          >
            {buka ? <XIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            {aktif?.name ?? 'Menu'}
          </button>

          {email && (
            <span className="hidden truncate text-sm text-[var(--neu-text-muted)] sm:inline">
              {email}
            </span>
          )}

          <button
            onClick={handleLogout}
            className={`neu-nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium ${FOKUS}`}
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>

          {buka && (
            <div className="neu-card absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-3rem))] p-3">
              <nav className="grid grid-cols-2 gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setBuka(false)}
                      className={`neu-nav-item flex items-center gap-2 px-3 py-2 text-sm font-medium ${
                        item.href === pathname ? 'active' : ''
                      } ${FOKUS}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
