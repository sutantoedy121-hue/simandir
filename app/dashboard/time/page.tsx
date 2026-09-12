'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, PlayIcon, StopCircleIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Activity {
  id: string
  title: string
  category: string
  type: 'positive' | 'negative' | 'neutral'
  start_time: string
  end_time: string | null
  duration_minutes: number | null
}

export default function TimePage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    type: 'neutral' as 'positive' | 'negative' | 'neutral',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
    const subscription = supabase
      .channel('activities_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchActivities()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchActivities() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(20)

    if (data) {
      setActivities(data)
      const active = data.find((a) => !a.end_time)
      setActiveActivity(active || null)
    }
  }

  async function startActivity() {
    if (!formData.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        title: formData.title,
        category: formData.category || 'Lainnya',
        type: formData.type,
        start_time: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      setActiveActivity(data)
      setFormData({ title: '', category: '', type: 'neutral' })
      setShowForm(false)
    }
  }

  async function stopActivity() {
    if (!activeActivity) return

    await supabase
      .from('activities')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeActivity.id)

    setActiveActivity(null)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--neu-text)]">Manajemen Waktu</h1>
        <p className="text-[var(--neu-text-muted)] mt-1">Lacak aktivitas Anda secara realtime</p>
      </div>

      {activeActivity ? (
        <div className="neu-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--neu-success)] font-medium">Sedang Berjalan</p>
              <h3 className="text-xl font-bold text-[var(--neu-success-text)] mt-1">{activeActivity.title}</h3>
              <p className="text-sm text-[var(--neu-success-text)] mt-1">
                Dimulai: {format(new Date(activeActivity.start_time), 'HH:mm')}
              </p>
            </div>
            <button
              onClick={stopActivity}
              className="flex items-center gap-2 px-4 py-2 neu-button-danger"
            >
              <StopCircleIcon className="w-5 h-5" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="neu-card p-6 mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 neu-button"
            >
              <PlayIcon className="w-5 h-5" />
              Mulai Aktivitas Baru
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">
                  Nama Aktivitas
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                  placeholder="Contoh: Belajar TypeScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                  placeholder="Contoh: Education"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Tipe</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'positive' | 'negative' | 'neutral',
                    })
                  }
                  className="w-full px-3 py-2 neu-input"
                >
                  <option value="positive">Positif</option>
                  <option value="neutral">Netral</option>
                  <option value="negative">Negatif</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startActivity}
                  className="px-4 py-2 neu-button"
                >
                  Mulai
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 neu-button-secondary"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="neu-card">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--neu-text)]">Riwayat Aktivitas</h2>
        </div>
        <div className="space-y-3 pb-3">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-[var(--neu-text-muted)]">
              Belum ada aktivitas. Mulai lacak waktu Anda!
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="neu-raised-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-[var(--neu-text)]">{activity.title}</h3>
                    <p className="text-sm text-[var(--neu-text-muted)] mt-1">
                      {activity.category} • {activity.type}
                    </p>
                    <p className="text-sm text-[var(--neu-text-muted)]">
                      {format(new Date(activity.start_time), 'dd/MM/yyyy HH:mm')}
                      {activity.end_time && ` - ${format(new Date(activity.end_time), 'HH:mm')}`}
                    </p>
                  </div>
                  {activity.duration_minutes && (
                    <span className="text-sm font-medium text-[var(--neu-accent)]">
                      {Math.round(activity.duration_minutes)} menit
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
