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
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Waktu</h1>
        <p className="text-gray-600 mt-1">Lacak aktivitas Anda secara realtime</p>
      </div>

      {activeActivity ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Sedang Berjalan</p>
              <h3 className="text-xl font-bold text-green-900 mt-1">{activeActivity.title}</h3>
              <p className="text-sm text-green-700 mt-1">
                Dimulai: {format(new Date(activeActivity.start_time), 'HH:mm')}
              </p>
            </div>
            <button
              onClick={stopActivity}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <StopCircleIcon className="w-5 h-5" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlayIcon className="w-5 h-5" />
              Mulai Aktivitas Baru
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Aktivitas
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Belajar TypeScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Education"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'positive' | 'negative' | 'neutral',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="positive">Positif</option>
                  <option value="neutral">Netral</option>
                  <option value="negative">Negatif</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startActivity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mulai
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Riwayat Aktivitas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Belum ada aktivitas. Mulai lacak waktu Anda!
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.category} • {activity.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(activity.start_time), 'dd/MM/yyyy HH:mm')}
                      {activity.end_time && ` - ${format(new Date(activity.end_time), 'HH:mm')}`}
                    </p>
                  </div>
                  {activity.duration_minutes && (
                    <span className="text-sm font-medium text-blue-600">
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
