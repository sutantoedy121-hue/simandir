'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ERROR_ID: Record<string, string> = {
  'New password should be different from the old password.':
    'Password baru harus berbeda dari yang lama.',
}

function pesanError(msg: string) {
  return ERROR_ID[msg] ?? msg
}

type Langkah = 'email' | 'kode' | 'password'

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('')
  const [kode, setKode] = useState('')
  const [pwBaru, setPwBaru] = useState('')
  const [pwUlang, setPwUlang] = useState('')
  const [langkah, setLangkah] = useState<Langkah>('email')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const kirimKode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSukses('')

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSukses(`Kode 6 digit dikirim ke ${email}. Masukkan kode di bawah.`)
      setLangkah('kode')
      setLoading(false)
    }
  }

  const verifikasiKode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: kode.trim(),
      type: 'email',
    })

    if (error) {
      setError('Kode salah atau kedaluwarsa. Coba lagi.')
      setLoading(false)
    } else {
      setSukses('Kode benar. Buat password baru Anda.')
      setLangkah('password')
      setLoading(false)
    }
  }

  const simpanPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pwBaru.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }
    if (pwBaru !== pwUlang) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwBaru })
    if (error) {
      setError(pesanError(error.message))
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="neu-card max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-[var(--neu-text)]">
            Lupa Password
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--neu-text-muted)]">
            {langkah === 'email' && 'Masukkan email, kami kirim kode 6 digit.'}
            {langkah === 'kode' && 'Kode sudah dikirim ke email Anda.'}
            {langkah === 'password' && 'Buat password baru untuk akun Anda.'}
          </p>
        </div>

        {error && <div className="neu-alert-error px-4 py-3 text-sm">{error}</div>}
        {sukses && <div className="neu-alert-success px-4 py-3 text-sm">{sukses}</div>}

        {langkah === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={kirimKode}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--neu-text)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="neu-input mt-1 block w-full px-4 py-3 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neu-button w-full flex justify-center py-3 px-4 text-sm font-medium"
            >
              {loading ? 'Mengirim...' : 'Kirim kode'}
            </button>
          </form>
        )}

        {langkah === 'kode' && (
          <form className="mt-8 space-y-6" onSubmit={verifikasiKode}>
            <div>
              <label htmlFor="kode" className="block text-sm font-medium text-[var(--neu-text)]">
                Kode 6 digit
              </label>
              <input
                id="kode"
                name="kode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className="neu-input mt-1 block w-full px-4 py-3 text-sm text-center tracking-[0.5em]"
                placeholder="••••••"
                value={kode}
                onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button
              type="submit"
              disabled={loading || kode.length !== 6}
              className="neu-button w-full flex justify-center py-3 px-4 text-sm font-medium"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
            <p className="text-center text-sm text-[var(--neu-text-muted)]">
              Tidak menerima kode?{' '}
              <button
                type="button"
                onClick={kirimKode}
                className="font-medium text-[var(--neu-accent)] hover:text-[var(--neu-accent-hover)]"
              >
                Kirim ulang
              </button>
            </p>
          </form>
        )}

        {langkah === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={simpanPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="pw" className="block text-sm font-medium text-[var(--neu-text)]">
                  Password baru
                </label>
                <input
                  id="pw"
                  type="password"
                  required
                  className="neu-input mt-1 block w-full px-4 py-3 text-sm"
                  value={pwBaru}
                  onChange={(e) => setPwBaru(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="pw2" className="block text-sm font-medium text-[var(--neu-text)]">
                  Ulangi password baru
                </label>
                <input
                  id="pw2"
                  type="password"
                  required
                  className="neu-input mt-1 block w-full px-4 py-3 text-sm"
                  value={pwUlang}
                  onChange={(e) => setPwUlang(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="neu-button w-full flex justify-center py-3 px-4 text-sm font-medium"
            >
              {loading ? 'Menyimpan...' : 'Simpan password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--neu-text-muted)]">
          Ingat password?{' '}
          <Link href="/auth/login" className="font-medium text-[var(--neu-accent)] hover:text-[var(--neu-accent-hover)]">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
