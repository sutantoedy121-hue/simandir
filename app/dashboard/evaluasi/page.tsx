'use client'

import { useState } from 'react'
import { RefreshCwIcon } from 'lucide-react'

interface Metrics {
  periode: string
  tugas: { selesai: number; dibuat: number }
  keuangan: {
    masuk: number
    keluar: number
    selisih: number
    kategoriTeratas: { kategori: string; total: number }[]
  }
  aktivitas: { totalMenit: number; jumlah: number }
  kebiasaan: { totalLog: number; hariAktif: number; daftar: string[] }
  jurnal: { jumlah: number; moodDominan: string | null }
  target: { aktif: number; selesai: number }
}

const rupiah = (n: number) => 'Rp ' + Number(n).toLocaleString('id-ID')

const MOOD: Record<string, string> = {
  great: 'Sangat baik',
  good: 'Baik',
  okay: 'Biasa saja',
  bad: 'Buruk',
  terrible: 'Sangat buruk',
}

export default function EvaluasiPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [analisis, setAnalisis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function muat() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/evaluasi', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal memuat evaluasi.')
        return
      }
      setMetrics(data.metrics)
      setAnalisis(data.analisis)
    } catch {
      setError('Gagal menghubungi server.')
    } finally {
      setLoading(false)
    }
  }

  const kartu = (label: string, nilai: string) => (
    <div className="neu-card p-4">
      <p className="text-sm text-[var(--neu-text-muted)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--neu-text)] mt-1">{nilai}</p>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--neu-text)]">Evaluasi Mingguan</h1>
          <p className="text-[var(--neu-text-muted)] mt-1">
            Tinjau 7 hari terakhir dan dapatkan analisis AI
          </p>
        </div>
        <button
          onClick={muat}
          disabled={loading}
          className="neu-button flex items-center gap-2 px-4 py-2 disabled:opacity-50"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Menganalisis...' : metrics ? 'Muat ulang' : 'Buat evaluasi'}
        </button>
      </div>

      {error && (
        <div className="neu-alert-error p-4 mb-6 text-sm text-[var(--neu-danger-text)]">
          {error}
        </div>
      )}

      {!metrics && !loading && !error && (
        <div className="neu-card p-12 text-center text-[var(--neu-text-muted)]">
          <p className="text-lg font-medium">Belum ada evaluasi</p>
          <p className="text-sm mt-2">
            Klik &ldquo;Buat evaluasi&rdquo; untuk merangkum 7 hari terakhir Anda.
          </p>
        </div>
      )}

      {metrics && (
        <>
          <p className="mb-6 text-sm text-[var(--neu-text-muted)]">
            Periode {metrics.periode}
          </p>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kartu('Tugas Selesai', `${metrics.tugas.selesai} / ${metrics.tugas.dibuat}`)}
            {kartu('Saldo Mingguan', rupiah(metrics.keuangan.selisih))}
            {kartu('Waktu Tercatat', `${(metrics.aktivitas.totalMenit / 60).toFixed(1)} jam`)}
            {kartu('Hari Aktif Kebiasaan', `${metrics.kebiasaan.hariAktif} / 7`)}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="neu-card p-6">
              <h2 className="text-xl font-bold text-[var(--neu-text)]">Keuangan</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-muted)]">Pemasukan</span>
                  <span className="font-medium text-[var(--neu-success-text)]">
                    {rupiah(metrics.keuangan.masuk)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-muted)]">Pengeluaran</span>
                  <span className="font-medium text-[var(--neu-danger-text)]">
                    {rupiah(metrics.keuangan.keluar)}
                  </span>
                </div>
                <div className="neu-inset-deep mt-3 rounded-lg p-3">
                  <p className="text-xs font-medium text-[var(--neu-text-muted)] mb-2">
                    Pengeluaran terbesar
                  </p>
                  {metrics.keuangan.kategoriTeratas.length === 0 ? (
                    <p className="text-xs text-[var(--neu-text-muted)]">Belum ada pengeluaran</p>
                  ) : (
                    <ul className="space-y-1">
                      {metrics.keuangan.kategoriTeratas.map((k) => (
                        <li key={k.kategori} className="flex justify-between text-xs">
                          <span className="text-[var(--neu-text)]">{k.kategori}</span>
                          <span className="text-[var(--neu-text-muted)]">{rupiah(k.total)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="neu-card p-6">
              <h2 className="text-xl font-bold text-[var(--neu-text)]">Kebiasaan & Jurnal</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-muted)]">Log kebiasaan</span>
                  <span className="font-medium text-[var(--neu-text)]">
                    {metrics.kebiasaan.totalLog}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-muted)]">Entri jurnal</span>
                  <span className="font-medium text-[var(--neu-text)]">{metrics.jurnal.jumlah}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-muted)]">Target aktif / selesai</span>
                  <span className="font-medium text-[var(--neu-text)]">
                    {metrics.target.aktif} / {metrics.target.selesai}
                  </span>
                </div>
                {metrics.jurnal.moodDominan && (
                  <div className="neu-inset-deep mt-3 rounded-lg p-3">
                    <p className="text-xs text-[var(--neu-text-muted)]">Suasana hati dominan</p>
                    <p className="mt-1 text-sm font-medium text-[var(--neu-text)]">
                      {MOOD[metrics.jurnal.moodDominan] ?? metrics.jurnal.moodDominan}
                    </p>
                  </div>
                )}
                {metrics.kebiasaan.daftar.length > 0 && (
                  <div className="neu-inset-deep mt-3 rounded-lg p-3">
                    <p className="text-xs text-[var(--neu-text-muted)] mb-1">Kebiasaan aktif</p>
                    <p className="text-xs text-[var(--neu-text)]">
                      {metrics.kebiasaan.daftar.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <section className="neu-card mt-6 p-6">
            <h2 className="text-xl font-bold text-[var(--neu-text)]">Analisis AI</h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--neu-text)]">
              {analisis || 'Analisis sedang disiapkan...'}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
