'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  { name: 'Waktu & Aktivitas', href: '/dashboard/time', icon: CalendarIcon },
  { name: 'Tugas', href: '/dashboard/tasks', icon: CheckSquareIcon },
  { name: 'Keuangan', href: '/dashboard/finance', icon: DollarSignIcon },
  { name: 'Kebiasaan', href: '/dashboard/habits', icon: RepeatIcon },
  { name: 'Target & Goal', href: '/dashboard/goals', icon: TargetIcon },
  { name: 'Catatan', href: '/dashboard/notes', icon: BookOpenIcon },
  { name: 'Project', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Jurnal', href: '/dashboard/journal', icon: FileTextIcon },
  { name: 'AI Assistant', href: '/dashboard/ai', icon: MessageSquareIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">SMD</h2>
        <p className="text-xs text-gray-500 mt-1">Sistem Manajemen Diri</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg w-full transition-colors"
        >
          <LogOutIcon className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  )
}
