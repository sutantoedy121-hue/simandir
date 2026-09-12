import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'gemini-2.0-flash'
const MAX_MESSAGE = 2000
const MAX_TURNS = 10

const TANPA_KUNCI =
  'Asisten AI belum aktif karena GEMINI_API_KEY belum diisi di .env.local. ' +
  'Ambil kunci gratis di aistudio.google.com, tambahkan baris ' +
  'GEMINI_API_KEY=... lalu restart server dev.'

const GAGAL =
  'Maaf, asisten AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.'

type Row = Record<string, unknown>

/**
 * RLS does the isolating: every query runs on the cookie-scoped server client,
 * so the policies filter to the signed-in user. No service-role key here.
 * A failing table degrades to an empty section instead of failing the request.
 */
async function ambil(query: PromiseLike<{ data: Row[] | null }>): Promise<Row[]> {
  try {
    const { data } = await query
    return data ?? []
  } catch {
    return []
  }
}

const rupiah = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID')
const tanggal = (v: unknown) =>
  typeof v === 'string' ? v.slice(0, 10) : ''

function ringkasTugas(rows: Row[]) {
  if (!rows.length) return 'Tidak ada tugas tertunda.'
  return rows
    .map(
      (t) =>
        `- ${t.title} (status: ${t.status}, prioritas: ${t.priority}` +
        `${t.deadline ? `, deadline: ${tanggal(t.deadline)}` : ''})`
    )
    .join('\n')
}

function ringkasTransaksi(rows: Row[]) {
  if (!rows.length) return 'Belum ada transaksi.'
  const masuk = rows
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const keluar = rows
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)
  const baris = rows
    .map(
      (t) =>
        `- ${tanggal(t.transaction_date)} ${t.type === 'income' ? 'masuk' : 'keluar'} ` +
        `${rupiah(Number(t.amount))} (${t.category})`
    )
    .join('\n')
  return (
    `Total dari ${rows.length} transaksi terakhir — masuk ${rupiah(masuk)}, ` +
    `keluar ${rupiah(keluar)}, selisih ${rupiah(masuk - keluar)}.\n${baris}`
  )
}

function ringkasAktivitas(rows: Row[]) {
  if (!rows.length) return 'Belum ada aktivitas tercatat.'
  return rows
    .map(
      (a) =>
        `- ${a.title} (${a.category}, ${tanggal(a.start_time)}` +
        `${a.duration_minutes ? `, ${a.duration_minutes} menit` : ''})`
    )
    .join('\n')
}

function ringkasKebiasaan(rows: Row[]) {
  if (!rows.length) return 'Belum ada kebiasaan.'
  return rows
    .map((h) => `- ${h.title} (${h.active ? 'aktif' : 'nonaktif'})`)
    .join('\n')
}

function ringkasTarget(rows: Row[]) {
  if (!rows.length) return 'Belum ada target.'
  return rows
    .map((g) => `- ${g.title} (${g.status}, ${g.progress_percentage}%)`)
    .join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const message = String(body?.message ?? '').slice(0, MAX_MESSAGE)
    if (!message.trim()) {
      return NextResponse.json({ error: 'Pesan kosong' }, { status: 400 })
    }

    // Incoming history is client-supplied, so treat it as untrusted: cap the
    // count, the length of each turn, and drop anything with an unknown role.
    const history = (Array.isArray(body?.history) ? body.history : [])
      .filter(
        (m: Row) =>
          m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
      )
      .slice(-MAX_TURNS)
      .map((m: Row) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).slice(0, MAX_MESSAGE) }],
      }))

    const [tugas, transaksi, aktivitas, kebiasaan, target] = await Promise.all([
      ambil(
        supabase
          .from('tasks')
          .select('title, status, priority, deadline')
          .eq('user_id', user.id)
          .neq('status', 'done')
          .limit(10)
      ),
      ambil(
        supabase
          .from('transactions')
          .select('type, amount, category, transaction_date')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(15)
      ),
      ambil(
        supabase
          .from('activities')
          .select('title, category, start_time, duration_minutes')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(10)
      ),
      ambil(supabase.from('habits').select('title, active').eq('user_id', user.id)),
      ambil(
        supabase
          .from('goals')
          .select('title, status, progress_percentage')
          .eq('user_id', user.id)
      ),
    ])

    const systemInstruction = `Anda adalah asisten pribadi di dalam SMD (Sistem Manajemen Diri), aplikasi berbahasa Indonesia.

Jawab HANYA berdasarkan data pengguna di bawah ini. Jika data tidak memuat jawabannya, katakan terus terang bahwa data itu belum tercatat di aplikasi — jangan mengarang angka. Jawab ringkas, langsung ke intinya, dalam bahasa Indonesia. Sebut angka apa adanya (jangan dibulatkan tanpa alasan).

Hari ini: ${new Date().toISOString().slice(0, 10)}

== TUGAS TERTUNDA ==
${ringkasTugas(tugas)}

== TRANSAKSI TERAKHIR ==
${ringkasTransaksi(transaksi)}

== AKTIVITAS TERAKHIR ==
${ringkasAktivitas(aktivitas)}

== KEBIASAAN ==
${ringkasKebiasaan(kebiasaan)}

== TARGET ==
${ringkasTarget(target)}`

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ reply: TANPA_KUNCI })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
        }),
      }
    )

    if (!res.ok) {
      // Log the provider detail server-side; it can echo request data, so it
      // never goes to the client.
      console.error('Gemini error:', res.status, await res.text())
      return NextResponse.json({ reply: GAGAL })
    }

    const data = await res.json()
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim() || GAGAL

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({ reply: GAGAL })
  }
}
