import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  Wallet,
  Flame,
  Target,
  FileText,
  FolderKanban,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wallet2,
} from 'lucide-react'

const MODUL = [
  { icon: LayoutDashboard, nama: 'Dashboard', desc: 'Ringkasan seluruh hidup Anda dalam satu layar.' },
  { icon: Timer, nama: 'Manajemen Waktu', desc: 'Catat aktivitas dengan tombol mulai/berhenti.' },
  { icon: CheckSquare, nama: 'Tugas', desc: 'Matriks Eisenhower memisahkan penting dari mendesak.' },
  { icon: Wallet, nama: 'Keuangan', desc: 'Pemasukan, pengeluaran, dan peringatan belanja.' },
  { icon: Flame, nama: 'Kebiasaan', desc: 'Streak harian dan tingkat penyelesaian 30 hari.' },
  { icon: Target, nama: 'Target', desc: 'Pecah tujuan besar jadi milestone terukur.' },
  { icon: FileText, nama: 'Catatan', desc: 'Basis pengetahuan dengan pencarian penuh teks.' },
  { icon: FolderKanban, nama: 'Proyek', desc: 'Lacak status dan progres tiap proyek.' },
  { icon: BookOpen, nama: 'Jurnal', desc: 'Catatan harian dengan pelacakan suasana hati.' },
  { icon: Sparkles, nama: 'Asisten AI', desc: 'Tanya jawab seputar data pribadi Anda.' },
]

const ALASAN = [
  {
    icon: ShieldCheck,
    judul: 'Data Anda milik Anda',
    isi: 'Setiap tabel dilindungi Row Level Security. Tidak ada satu pun pengguna yang bisa membaca data pengguna lain, bahkan jika tokennya bocor.',
  },
  {
    icon: Zap,
    judul: 'Satu sistem, bukan sepuluh aplikasi',
    isi: 'Berhenti berpindah antara aplikasi catatan, pelacak keuangan, dan to-do list. Semuanya saling terhubung di satu tempat.',
  },
  {
    icon: Wallet2,
    judul: 'Gratis, tanpa jebakan',
    isi: 'Dibangun di atas tier gratis Vercel dan Supabase. Tanpa langganan, tanpa batas fitur buatan.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              S
            </span>
            <span className="text-lg font-semibold text-gray-900">SMD</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ke Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 sm:px-4"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-blue-50 via-blue-50/40 to-transparent"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            10 modul, satu sistem
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-6xl">
            Kelola seluruh hidup Anda dari{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              satu tempat
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Sistem Manajemen Diri menyatukan waktu, tugas, keuangan, kebiasaan,
            target, catatan, proyek, dan jurnal dalam satu aplikasi. Tanpa
            berpindah tab, tanpa data tercecer.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Mulai gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Saya sudah punya akun
            </Link>
          </div>
        </div>
      </section>

      {/* Modul */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Semua yang Anda butuhkan
          </h2>
          <p className="mt-4 text-gray-600">
            Setiap modul bekerja sendiri, tapi jadi jauh lebih berguna saat
            digabungkan.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODUL.map(({ icon: Icon, nama, desc }) => (
            <div
              key={nama}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{nama}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alasan */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-3">
            {ALASAN.map(({ icon: Icon, judul, isi }) => (
              <div key={judul}>
                <Icon className="h-6 w-6 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Mulai hari ini
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Buat akun dalam satu menit. Tidak perlu kartu kredit, tidak ada
            biaya tersembunyi.
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-blue-700 shadow-sm hover:bg-blue-50"
          >
            Buat akun gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row">
          <p>SMD — Sistem Manajemen Diri</p>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-gray-900">
              Masuk
            </Link>
            <Link href="/auth/register" className="hover:text-gray-900">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
