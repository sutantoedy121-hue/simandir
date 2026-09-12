import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await req.json()

    // ponytail: Real AI integration - fetch user context from all modules
    // For now, return mock response
    const reply = `Terima kasih atas pesan Anda: "${message}".

AI Assistant belum sepenuhnya terintegrasi. Untuk mengaktifkan:
1. Tambahkan API key Anthropic/OpenAI di environment variables
2. Implementasi context gathering dari database (aktivitas, keuangan, tugas)
3. Kirim ke LLM dengan prompt engineering yang tepat

Saat ini Anda bisa:
- Lihat dashboard untuk ringkasan statistik
- Kelola waktu, tugas, keuangan secara manual
- Track kebiasaan dan goal Anda`

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
