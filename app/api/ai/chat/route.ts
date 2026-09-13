import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'gemini-3.1-flash-lite'
const MAX_MESSAGE = 2000
const MAX_TURNS = 10
const MAX_ROUND_TOOL = 4

const TANPA_KUNCI =
  'Asisten AI belum aktif karena GEMINI_API_KEY belum diisi di .env.local. ' +
  'Ambil kunci gratis di aistudio.google.com, tambahkan baris ' +
  'GEMINI_API_KEY=... lalu restart server dev.'

const GAGAL =
  'Maaf, asisten AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.'

type Row = Record<string, unknown>
type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * RLS does the isolating: every query — read and write — runs on the
 * cookie-scoped server client, so the policies filter to the signed-in user.
 * No service-role key here. A failing table degrades to an empty section
 * instead of failing the request.
 */
async function ambil(query: PromiseLike<{ data: Row[] | null }>): Promise<Row[]> {
  try {
    const { data } = await query
    return data ?? []
  } catch {
    return []
  }
}

const str = (v: unknown, max = 2000) => (v == null ? '' : String(v)).slice(0, max)

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function int(v: unknown, lo: number, hi: number, fallback: number) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.min(hi, Math.max(lo, n))
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

// --- Tools ----------------------------------------------------------------

const TOOLS = [
  {
    name: 'tambah_transaksi',
    description:
      'Catat transaksi keuangan baru: pemasukan (income) atau pengeluaran (expense).',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: ['income', 'expense'], description: 'income = pemasukan, expense = pengeluaran' },
        amount: { type: 'NUMBER', description: 'Jumlah dalam Rupiah, angka positif' },
        category: { type: 'STRING', description: 'Kategori, mis. Makanan, Transport, Gaji' },
        description: { type: 'STRING', description: 'Catatan opsional' },
        transaction_date: { type: 'STRING', description: 'Tanggal YYYY-MM-DD. Kosongkan untuk hari ini' },
      },
      required: ['type', 'amount', 'category'],
    },
  },
  {
    name: 'tambah_tugas',
    description: 'Buat tugas baru.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Judul tugas' },
        description: { type: 'STRING', description: 'Detail opsional' },
        urgency: { type: 'INTEGER', description: '1-5, seberapa mendesak (default 3)' },
        importance: { type: 'INTEGER', description: '1-5, seberapa penting (default 3)' },
        deadline: { type: 'STRING', description: 'Tenggat ISO. Kosongkan jika tidak ada' },
      },
      required: ['title'],
    },
  },
  {
    name: 'tambah_aktivitas',
    description: 'Catat aktivitas yang baru saja dilakukan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama aktivitas' },
        category: { type: 'STRING', description: 'Kategori, mis. Education, Health' },
        type: { type: 'STRING', enum: ['positive', 'negative', 'neutral'], description: 'Sifat aktivitas' },
        description: { type: 'STRING', description: 'Catatan opsional' },
        start_time: { type: 'STRING', description: 'Waktu mulai ISO. Kosongkan untuk sekarang' },
      },
      required: ['title', 'category', 'type'],
    },
  },
  {
    name: 'tambah_kebiasaan',
    description: 'Buat kebiasaan baru untuk dilacak.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama kebiasaan' },
        frequency: { type: 'STRING', enum: ['daily', 'weekly', 'custom'], description: 'Frekuensi' },
        description: { type: 'STRING', description: 'Catatan opsional' },
        target_count: { type: 'INTEGER', description: 'Target per periode (default 1)' },
      },
      required: ['title', 'frequency'],
    },
  },
  {
    name: 'tambah_target',
    description: 'Buat target/goal baru.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama target' },
        description: { type: 'STRING', description: 'Detail opsional' },
        target_date: { type: 'STRING', description: 'Tanggal target YYYY-MM-DD' },
        progress_percentage: { type: 'INTEGER', description: 'Progres awal 0-100 (default 0)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'tambah_catatan',
    description: 'Simpan catatan baru.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Judul catatan' },
        content: { type: 'STRING', description: 'Isi catatan' },
      },
      required: ['title'],
    },
  },
  {
    name: 'tambah_proyek',
    description: 'Buat proyek baru.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama proyek' },
        description: { type: 'STRING', description: 'Detail opsional' },
        status: { type: 'STRING', enum: ['planning', 'active', 'completed', 'on_hold'], description: 'Status (default planning)' },
        target_date: { type: 'STRING', description: 'Tanggal target YYYY-MM-DD' },
      },
      required: ['title'],
    },
  },
  {
    name: 'tambah_jurnal',
    description: 'Tulis entri jurnal harian.',
    parameters: {
      type: 'OBJECT',
      properties: {
        content: { type: 'STRING', description: 'Isi jurnal' },
        title: { type: 'STRING', description: 'Judul opsional' },
        mood: { type: 'STRING', enum: ['great', 'good', 'okay', 'bad', 'terrible'], description: 'Suasana hati' },
        entry_date: { type: 'STRING', description: 'Tanggal YYYY-MM-DD. Kosongkan untuk hari ini' },
      },
      required: ['content'],
    },
  },
  {
    name: 'selesaikan_tugas',
    description: 'Tandai tugas yang cocok dengan judulnya sebagai selesai.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Judul tugas yang ingin ditandai selesai' },
      },
      required: ['title'],
    },
  },
  {
    name: 'catat_kebiasaan',
    description: 'Catat bahwa sebuah kebiasaan dikerjakan hari ini.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama kebiasaan' },
        note: { type: 'STRING', description: 'Catatan opsional' },
      },
      required: ['title'],
    },
  },
]

async function jalankanTool(
  name: string,
  args: Row,
  supabase: Supabase,
  userId: string
): Promise<string> {
  switch (name) {
    case 'tambah_transaksi': {
      const amount = num(args.amount)
      if (!(amount > 0)) return 'Gagal: jumlah harus angka positif.'
      const type = args.type === 'income' ? 'income' : 'expense'
      const category = str(args.category, 100) || 'Lainnya'
      const description = str(args.description, 500) || null
      const transaction_date = str(args.transaction_date) || new Date().toISOString()
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount,
        type,
        category,
        description,
        transaction_date,
      })
      if (error) return `Gagal menyimpan transaksi: ${error.message}`
      return `Tersimpan: ${type === 'income' ? 'pemasukan' : 'pengeluaran'} ${rupiah(amount)} (${category}).`
    }

    case 'tambah_tugas': {
      const title = str(args.title, 200)
      if (!title) return 'Gagal: judul tugas wajib diisi.'
      const urgency = int(args.urgency, 1, 5, 3)
      const importance = int(args.importance, 1, 5, 3)
      let priority = 4
      if (urgency >= 4 && importance >= 4) priority = 1
      else if (importance >= 4) priority = 2
      else if (urgency >= 4) priority = 3
      const description = str(args.description, 1000) || null
      const deadline = str(args.deadline) || null
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title,
        description,
        urgency,
        importance,
        priority,
        deadline,
        status: 'todo',
      })
      if (error) return `Gagal menyimpan tugas: ${error.message}`
      return `Tersimpan: tugas "${title}" (prioritas ${priority}).`
    }

    case 'tambah_aktivitas': {
      const title = str(args.title, 200)
      const category = str(args.category, 100)
      const type = ['positive', 'negative', 'neutral'].includes(String(args.type))
        ? (args.type as string)
        : 'neutral'
      if (!title || !category) return 'Gagal: nama dan kategori aktivitas wajib diisi.'
      const description = str(args.description, 1000) || null
      const start_time = str(args.start_time) || new Date().toISOString()
      const { error } = await supabase.from('activities').insert({
        user_id: userId,
        title,
        category,
        type,
        description,
        start_time,
      })
      if (error) return `Gagal menyimpan aktivitas: ${error.message}`
      return `Tersimpan: aktivitas "${title}" (${category}, ${type}).`
    }

    case 'tambah_kebiasaan': {
      const title = str(args.title, 200)
      const frequency = ['daily', 'weekly', 'custom'].includes(String(args.frequency))
        ? (args.frequency as string)
        : 'daily'
      if (!title) return 'Gagal: nama kebiasaan wajib diisi.'
      const description = str(args.description, 1000) || null
      const target_count = int(args.target_count, 1, 100, 1)
      const { error } = await supabase.from('habits').insert({
        user_id: userId,
        title,
        frequency,
        description,
        target_count,
        active: true,
      })
      if (error) return `Gagal menyimpan kebiasaan: ${error.message}`
      return `Tersimpan: kebiasaan "${title}" (${frequency}).`
    }

    case 'tambah_target': {
      const title = str(args.title, 200)
      if (!title) return 'Gagal: nama target wajib diisi.'
      const description = str(args.description, 1000) || null
      const target_date = str(args.target_date) || null
      const progress_percentage = int(args.progress_percentage, 0, 100, 0)
      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        title,
        description,
        target_date,
        progress_percentage,
        status: 'active',
      })
      if (error) return `Gagal menyimpan target: ${error.message}`
      return `Tersimpan: target "${title}".`
    }

    case 'tambah_catatan': {
      const title = str(args.title, 200)
      if (!title) return 'Gagal: judul catatan wajib diisi.'
      const content = str(args.content, 20000) || null
      const { error } = await supabase.from('notes').insert({
        user_id: userId,
        title,
        content,
      })
      if (error) return `Gagal menyimpan catatan: ${error.message}`
      return `Tersimpan: catatan "${title}".`
    }

    case 'tambah_proyek': {
      const title = str(args.title, 200)
      if (!title) return 'Gagal: nama proyek wajib diisi.'
      const description = str(args.description, 1000) || null
      const status = ['planning', 'active', 'completed', 'on_hold'].includes(String(args.status))
        ? (args.status as string)
        : 'planning'
      const target_date = str(args.target_date) || null
      const { error } = await supabase.from('projects').insert({
        user_id: userId,
        title,
        description,
        status,
        target_date,
      })
      if (error) return `Gagal menyimpan proyek: ${error.message}`
      return `Tersimpan: proyek "${title}" (${status}).`
    }

    case 'tambah_jurnal': {
      const content = str(args.content, 20000)
      if (!content) return 'Gagal: isi jurnal wajib diisi.'
      const title = str(args.title, 200) || null
      const mood = ['great', 'good', 'okay', 'bad', 'terrible'].includes(String(args.mood))
        ? (args.mood as string)
        : null
      const entry_date = str(args.entry_date) || new Date().toISOString().slice(0, 10)
      const { error } = await supabase.from('journal_entries').insert({
        user_id: userId,
        content,
        title,
        mood,
        entry_date,
      })
      if (error) {
        if (String(error.message).includes('duplicate') || error.code === '23505') {
          return `Sudah ada entri jurnal untuk ${entry_date}. Hapus dulu di halaman Jurnal sebelum menambah lagi.`
        }
        return `Gagal menyimpan jurnal: ${error.message}`
      }
      return `Tersimpan: entri jurnal (${entry_date}).`
    }

    case 'selesaikan_tugas': {
      const title = str(args.title, 200).toLowerCase()
      if (!title) return 'Gagal: judul tugas wajib diisi.'
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', userId)
        .neq('status', 'done')
        .ilike('title', `%${title}%`)
        .limit(1)
      if (error) return `Gagal mencari tugas: ${error.message}`
      if (!data?.length) return `Tidak menemukan tugas tertunda dengan judul seperti "${str(args.title)}".`
      const { error: upErr } = await supabase
        .from('tasks')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', data[0].id)
      if (upErr) return `Gagal menandai tugas selesai: ${upErr.message}`
      return `Tugas "${data[0].title}" ditandai selesai.`
    }

    case 'catat_kebiasaan': {
      const title = str(args.title, 200).toLowerCase()
      if (!title) return 'Gagal: nama kebiasaan wajib diisi.'
      const { data, error } = await supabase
        .from('habits')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${title}%`)
        .limit(1)
      if (error) return `Gagal mencari kebiasaan: ${error.message}`
      if (!data?.length) return `Tidak menemukan kebiasaan dengan nama seperti "${str(args.title)}".`
      const note = str(args.note, 500) || null
      const { error: logErr } = await supabase.from('habit_logs').insert({
        user_id: userId,
        habit_id: data[0].id,
        note,
      })
      if (logErr) return `Gagal mencatat kebiasaan: ${logErr.message}`
      return `Kebiasaan "${data[0].title}" dicatat selesai hari ini.`
    }

    default:
      return `Alat "${name}" tidak dikenali.`
  }
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

Aturan utama:
- Jika pengguna meminta Anda mencatat/membuat/menambah sesuatu, PAKAI alat (tool) yang tersedia — jangan hanya menolak atau menjelaskan cara manual. Setelah alat berhasil, konfirmasi singkat dalam bahasa Indonesia dan sebutkan apa yang tersimpan.
- Untuk pertanyaan tentang data, jawab HANYA berdasarkan data pengguna di bawah ini. Jika data tidak memuat jawabannya, katakan bahwa data itu belum tercatat — jangan mengarang angka.
- Jangan pernah menghapus data. Tidak ada alat untuk menghapus.
- Jawab ringkas, langsung ke intinya, dalam bahasa Indonesia.

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

    async function panggil(contents: unknown[]) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools: [{ functionDeclarations: TOOLS }],
            contents,
          }),
        }
      )
      if (!res.ok) {
        console.error('Gemini error:', res.status, await res.text())
        return null
      }
      return await res.json()
    }

    let contents: unknown[] = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ]
    let reply = ''

    for (let langkah = 0; langkah < MAX_ROUND_TOOL; langkah++) {
      const data = await panggil(contents)
      if (!data) return NextResponse.json({ reply: GAGAL })

      const parts: Array<{ text?: string; functionCall?: Row }> =
        data?.candidates?.[0]?.content?.parts ?? []
      const calls = parts.filter((p) => p?.functionCall)

      if (calls.length === 0) {
        reply = parts.map((p) => p.text ?? '').join('').trim()
        break
      }

      const balasanFungsi = []
      for (const call of calls) {
        const hasil = await jalankanTool(
          String(call.functionCall?.name ?? ''),
          (call.functionCall?.args as Row) ?? {},
          supabase,
          user.id
        )
        balasanFungsi.push({
          functionResponse: {
            name: call.functionCall?.name,
            response: { result: hasil },
          },
        })
      }

      contents.push({ role: 'model', parts })
      contents.push({ role: 'user', parts: balasanFungsi })
    }

    return NextResponse.json({ reply: reply || GAGAL })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({ reply: GAGAL })
  }
}
