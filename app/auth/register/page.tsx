'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ERROR_ID: Record<string, string> = {
  'Invalid login credentials': 'Email atau password salah.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk Anda.',
  'User already registered': 'Email ini sudah terdaftar. Silakan masuk.',
  'Password should be at least 6 characters': 'Password minimal 6 karakter.',
}

function pesanError(msg: string) {
  return ERROR_ID[msg] ?? msg
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(pesanError(error.message))
      setLoading(false)
      return
    }

    // Confirmation email is on (Supabase default), so signUp returns no session.
    // Pushing to /dashboard here just bounces off the middleware back to login.
    if (!data.session) {
      setSukses(
        `Akun dibuat. Kami mengirim tautan konfirmasi ke ${email}. Buka tautan itu dulu, baru masuk.`
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="neu-card max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-[var(--neu-text)]">
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--neu-text-muted)]">
            Mulai kelola hidup Anda
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="neu-alert-error px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {sukses && (
            <div className="neu-alert-success px-4 py-3 text-sm">
              {sukses}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[var(--neu-text)]">
                Nama Lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="neu-input mt-1 block w-full px-4 py-3 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--neu-text)]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="neu-input mt-1 block w-full px-4 py-3 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-[var(--neu-text-muted)]">Minimal 6 karakter</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="neu-button w-full flex justify-center py-3 px-4 text-sm font-medium"
            >
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </div>

          <p className="text-center text-sm text-[var(--neu-text-muted)]">
            Sudah punya akun?{' '}
            <a href="/auth/login" className="font-medium text-[var(--neu-accent)] hover:text-[var(--neu-accent-hover)]">
              Masuk
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
