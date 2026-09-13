'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquareIcon } from 'lucide-react'

// Tombol mengambang menuju chat AI. Sembunyi saat sudah berada di /dashboard/ai.
export default function FloatingAIButton() {
  const pathname = usePathname()
  if (pathname === '/dashboard/ai') return null

  return (
    <Link
      href="/dashboard/ai"
      title="Buka AI Assistant"
      aria-label="Buka AI Assistant"
      className="neu-button fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-neu-raised"
    >
      <MessageSquareIcon className="h-6 w-6" />
    </Link>
  )
}
