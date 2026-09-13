'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CameraIcon, SaveIcon, KeyRoundIcon, MailIcon } from 'lucide-react'

const ERROR_ID: Record<string, string> = {
  'New password should be different from the old password.':
    'Password baru harus berbeda dari yang lama.',
  'Invalid login credentials': 'Password lama salah.',
}

function pesanError(msg: string) {
  return ERROR_ID[msg] ?? msg
}

// Resize + kompres ke JPEG kecil, kembalikan data URL. Foto disimpan sebagai
// data URL di profiles.avatar_url — nol storage bucket, langsung jalan.
function resizeGambar(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const skala = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * skala)
      canvas.height = Math.round(img.height * skala)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas gagal'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('Gambar tidak valid'))
    img.src = url
  })
}

export default function ProfilPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [nama, setNama] = useState('')
  const [username, setUsername] = useState('')
  const [hobi, setHobi] = useState('')
  const [favorit, setFavorit] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [email, setEmail] = useState('')

  const [pesan, setPesan] = useState('')
  const [error, setError] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Ganti email
  const [emailBaru, setEmailBaru] = useState('')
  const [simpanEmail, setSimpanEmail] = useState(false)

  // Ganti password
  const [pwLama, setPwLama] = useState('')
  const [pwBaru, setPwBaru] = useState('')
  const [pwUlang, setPwUlang] = useState('')
  const [simpanPw, setSimpanPw] = useState(false)

  useEffect(() => {
    muat()
  }, [])

  async function muat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email ?? '')

    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, hobi, favorit, bio, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setNama(data.full_name ?? '')
      setUsername(data.username ?? '')
      setHobi(data.hobi ?? '')
      setFavorit(data.favorit ?? '')
      setBio(data.bio ?? '')
      setAvatar(data.avatar_url ?? '')
    }
  }

  async function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Pilih file gambar.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Gambar maksimal 5 MB.')
      return
    }
    try {
      setAvatar(await resizeGambar(file))
    } catch {
      setError('Gagal membaca gambar.')
    }
  }

  async function simpanProfil() {
    if (!userId) return
    setMenyimpan(true)
    setError('')
    setPesan('')

    const usernameBersih = username.trim()
    if (usernameBersih) {
      const { data: ada } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameBersih)
        .neq('id', userId)
        .maybeSingle()
      if (ada) {
        setError('Username itu sudah dipakai orang lain.')
        setMenyimpan(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: nama.trim() || null,
        username: usernameBersih || null,
        hobi: hobi.trim() || null,
        favorit: favorit.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatar || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      setError(pesanError(error.message))
    } else {
      setPesan('Profil tersimpan.')
    }
    setMenyimpan(false)
  }

  async function gantiEmail() {
    if (!emailBaru.trim()) {
      setError('Masukkan email baru.')
      return
    }
    setSimpanEmail(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ email: emailBaru.trim() })
    if (error) {
      setError(pesanError(error.message))
    } else {
      setPesan('Tautan konfirmasi dikirim ke email baru. Buka tautan itu untuk mengaktifkan.')
      setEmailBaru('')
    }
    setSimpanEmail(false)
  }

  async function gantiPassword() {
    if (!pwLama) {
      setError('Masukkan password lama Anda.')
      return
    }
    if (pwBaru.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }
    if (pwBaru !== pwUlang) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setSimpanPw(true)
    setError('')

    // Verifikasi password lama dulu — token login saja belum cukup, karena
    // pengguna meminta ganti password harus membuktikan tahu password lama.
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: pwLama,
    })
    if (authErr) {
      setError(pesanError(authErr.message))
      setSimpanPw(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pwBaru })
    if (error) {
      setError(pesanError(error.message))
    } else {
      setPesan('Password berhasil diganti.')
      setPwLama('')
      setPwBaru('')
      setPwUlang('')
    }
    setSimpanPw(false)
  }

  const field =
    'w-full px-3 py-2 neu-input'
  const label = 'block text-sm font-medium text-[var(--neu-text)] mb-1'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--neu-text)]">Profil</h1>
        <p className="text-[var(--neu-text-muted)] mt-1">Kelola detail akun dan data pribadi Anda</p>
      </div>

      {pesan && (
        <div className="neu-alert-success p-4 mb-6 text-sm text-[var(--neu-success-text)]">{pesan}</div>
      )}
      {error && (
        <div className="neu-alert-error p-4 mb-6 text-sm text-[var(--neu-danger-text)]">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Foto + identitas */}
        <div className="neu-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative group"
              title="Ganti foto profil"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Foto profil"
                  className="w-28 h-28 rounded-full object-cover neu-raised"
                />
              ) : (
                <div className="neu-inset w-28 h-28 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-[var(--neu-accent)]">
                    {(nama || email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="neu-icon-circle absolute -bottom-1 -right-1 w-9 h-9">
                <CameraIcon className="h-4 w-4 text-[var(--neu-accent)]" />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pilihFoto}
            />
            <p className="mt-4 font-semibold text-[var(--neu-text)]">
              {nama || 'Belum ada nama'}
            </p>
            <p className="text-sm text-[var(--neu-text-muted)]">{email}</p>
            {username && <p className="text-sm text-[var(--neu-accent)]">@{username}</p>}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className={label}>Nama lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className={field}
                placeholder="Nama Anda"
              />
            </div>
            <div>
              <label className={label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={field}
                placeholder="tanpa spasi, unik"
              />
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-6 lg:col-span-2">
          <div className="neu-card p-6">
            <h2 className="text-lg font-bold text-[var(--neu-text)] mb-4">Tentang Anda</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Hobi</label>
                <input
                  type="text"
                  value={hobi}
                  onChange={(e) => setHobi(e.target.value)}
                  className={field}
                  placeholder="Contoh: membaca, lari, coding"
                />
              </div>
              <div>
                <label className={label}>Favorit</label>
                <input
                  type="text"
                  value={favorit}
                  onChange={(e) => setFavorit(e.target.value)}
                  className={field}
                  placeholder="Contoh: kopi, musik lo-fi, hujan"
                />
              </div>
              <div>
                <label className={label}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={field}
                  rows={4}
                  placeholder="Ceritakan sedikit tentang diri Anda"
                />
              </div>
              <button
                onClick={simpanProfil}
                disabled={menyimpan}
                className="neu-button flex items-center gap-2 px-4 py-2 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4" />
                {menyimpan ? 'Menyimpan...' : 'Simpan profil'}
              </button>
            </div>
          </div>

          <div className="neu-card p-6">
            <h2 className="text-lg font-bold text-[var(--neu-text)] mb-4 flex items-center gap-2">
              <MailIcon className="h-4 w-4 text-[var(--neu-accent)]" />
              Ganti email
            </h2>
            <p className="text-sm text-[var(--neu-text-muted)] mb-4">
              Email saat ini: {email}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={emailBaru}
                onChange={(e) => setEmailBaru(e.target.value)}
                className={field + ' sm:flex-1'}
                placeholder="Email baru"
              />
              <button
                onClick={gantiEmail}
                disabled={simpanEmail}
                className="neu-button-secondary px-4 py-2 disabled:opacity-50"
              >
                {simpanEmail ? 'Mengirim...' : 'Ganti email'}
              </button>
            </div>
          </div>

          <div className="neu-card p-6">
            <h2 className="text-lg font-bold text-[var(--neu-text)] mb-4 flex items-center gap-2">
              <KeyRoundIcon className="h-4 w-4 text-[var(--neu-accent)]" />
              Ganti password
            </h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Password lama</label>
                <input
                  type="password"
                  value={pwLama}
                  onChange={(e) => setPwLama(e.target.value)}
                  className={field}
                  placeholder="Password saat ini"
                />
              </div>
              <div>
                <label className={label}>Password baru</label>
                <input
                  type="password"
                  value={pwBaru}
                  onChange={(e) => setPwBaru(e.target.value)}
                  className={field}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className={label}>Ulangi password baru</label>
                <input
                  type="password"
                  value={pwUlang}
                  onChange={(e) => setPwUlang(e.target.value)}
                  className={field}
                  placeholder="Ketik ulang"
                />
              </div>
              <button
                onClick={gantiPassword}
                disabled={simpanPw}
                className="neu-button flex items-center gap-2 px-4 py-2 disabled:opacity-50"
              >
                <KeyRoundIcon className="h-4 w-4" />
                {simpanPw ? 'Menyimpan...' : 'Ganti password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
