import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'gemini-3.1-flash-lite'

const TANPA_KUNCI =
  'Analisis AI belum aktif karena GEMINI_API_KEY belum diisi di .env.local.'

const GAGAL =
  'Maaf, analisis AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi.'

type Row = Record<string, unknown>

async function ambil(query: PromiseLike<{ data: Row[] | null }>): Promise<Row[]> {
  try {
    const { data } = await query
    return data ?? []
  } catch {
    return []
  }
}

const rupiah = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID')
const tanggal = (d: Date) => d.toISOString().slice(0, 10)
const jml = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const akhir = new Date()
    const awal = new Date(akhir.getTime() - 7 * 24 * 60 * 60 * 1000)
    const awalISO = awal.toISOString()
    const awalHari = tanggal(awal)

    const [
      tugasSelesai,
      tugasDibuat,
      transaksi,
      aktivitas,
      logKebiasaan,
      kebiasaan,
      jurnal,
      target,
    ] = await Promise.all([
      ambil(
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'done')
          .gte('completed_at', awalISO)
      ),
      ambil(
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', awalISO)
      ),
      ambil(
        supabase
          .from('transactions')
          .select('type, amount, category')
          .eq('user_id', user.id)
          .gte('transaction_date', awalISO)
      ),
      ambil(
        supabase
          .from('activities')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('start_time', awalISO)
      ),
      ambil(
        supabase
          .from('habit_logs')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', awalISO)
      ),
      ambil(supabase.from('habits').select('title').eq('user_id', user.id).eq('active', true)),
      ambil(
        supabase
          .from('journal_entries')
          .select('mood')
          .eq('user_id', user.id)
          .gte('entry_date', awalHari)
      ),
      ambil(supabase.from('goals').select('title, status').eq('user_id', user.id)),
    ])

    // Keuangan
    let masuk = 0
    let keluar = 0
    const perKategori: Record<string, number> = {}
    for (const t of transaksi) {
      const n = jml(t.amount)
      if (t.type === 'income') masuk += n
      else {
        keluar += n
        const k = String(t.category ?? 'Lainnya')
        perKategori[k] = (perKategori[k] ?? 0) + n
      }
    }
    const kategoriTeratas = Object.entries(perKategori)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    // Aktivitas
    let totalMenit = 0
    for (const a of aktivitas) totalMenit += jml(a.duration_minutes)

    // Kebiasaan: log per hari
    const perHari: Record<string, number> = {}
    for (const l of logKebiasaan) {
      const d = typeof l.completed_at === 'string' ? l.completed_at.slice(0, 10) : ''
      if (d) perHari[d] = (perHari[d] ?? 0) + 1
    }

    // Jurnal: mood dominan
    const moodHit: Record<string, number> = {}
    for (const j of jurnal) {
      const m = String(j.mood ?? '')
      if (m) moodHit[m] = (moodHit[m] ?? 0) + 1
    }
    const moodDominan =
      Object.entries(moodHit).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const targetAktif = target.filter((g) => g.status === 'active').length
    const targetSelesai = target.filter((g) => g.status === 'completed').length

    const metrics = {
      periode: `${tanggal(awal)} s/d ${tanggal(akhir)}`,
      tugas: { selesai: tugasSelesai.length, dibuat: tugasDibuat.length },
      keuangan: {
        masuk,
        keluar,
        selisih: masuk - keluar,
        kategoriTeratas: kategoriTeratas.map(([k, v]) => ({ kategori: k, total: v })),
      },
      aktivitas: { totalMenit, jumlah: aktivitas.length },
      kebiasaan: {
        totalLog: logKebiasaan.length,
        hariAktif: Object.keys(perHari).length,
        daftar: kebiasaan.map((h) => String(h.title)),
      },
      jurnal: { jumlah: jurnal.length, moodDominan },
      target: { aktif: targetAktif, selesai: targetSelesai },
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ metrics, analisis: TANPA_KUNCI })
    }

    const konteks = `Periode: ${metrics.periode}
- Tugas selesai: ${metrics.tugas.selesai} dari ${metrics.tugas.dibuat} yang dibuat.
- Keuangan: pemasukan ${rupiah(masuk)}, pengeluaran ${rupiah(keluar)}, selisih ${rupiah(masuk - keluar)}.${
      kategoriTeratas.length
        ? ' Kategori pengeluaran terbesar: ' +
          kategoriTeratas.map(([k, v]) => `${k} (${rupiah(v)})`).join(', ') +
          '.'
        : ''
    }
- Aktivitas tercatat: ${aktivitas.length}, total ${totalMenit} menit (${(totalMenit / 60).toFixed(1)} jam).
- Kebiasaan: ${logKebiasaan.length} log, ${Object.keys(perHari).length} hari aktif, dari kebiasaan: ${
      kebiasaan.length ? kebiasaan.map((h) => h.title).join(', ') : '(belum ada)'
    }.
- Jurnal: ${jurnal.length} entri${moodDominan ? `, suasana hati dominan ${moodDominan}` : ''}.
- Target: ${targetAktif} aktif, ${targetSelesai} selesai.`

    const systemInstruction = `Anda adalah pelatih produktivitas pribadi di dalam SMD (Sistem Manajemen Diri), aplikasi berbahasa Indonesia.

Tugas Anda: tulis evaluasi mingguan untuk pengguna HANYA berdasarkan data di bawah ini. Jangan mengarang angka atau kejadian yang tidak ada di data. Jika sebagian besar data kosong, katakan bahwa minggu ini belum banyak tercatat dan dorong untuk mulai mencatat.

Format jawaban (pakai judul pendek, bahasa Indonesia, ringkas):
1. Ringkasan minggu — 2-3 kalimat.
2. Yang berjalan baik — poin-poin.
3. Yang perlu diperbaiki — poin-poin.
4. Saran untuk minggu depan — 2-3 saran spesifik dan bisa langsung dilakukan.

Nada: hangat, jujur, tidak menggurui.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: konteks }] }],
        }),
      }
    )

    if (!res.ok) {
      console.error('Gemini evaluasi error:', res.status, await res.text())
      return NextResponse.json({ metrics, analisis: GAGAL })
    }

    const data = await res.json()
    const analisis =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim() || GAGAL

    return NextResponse.json({ metrics, analisis })
  } catch (error) {
    console.error('Evaluasi error:', error)
    return NextResponse.json({ error: GAGAL }, { status: 500 })
  }
}
