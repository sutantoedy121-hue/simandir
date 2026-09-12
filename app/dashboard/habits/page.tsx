'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, CheckIcon, FlameIcon } from 'lucide-react'
import { format, startOfDay, differenceInDays } from 'date-fns'

interface Habit {
  id: string
  title: string
  description: string | null
  frequency: 'daily' | 'weekly' | 'custom'
  target_count: number
  active: boolean
}

interface HabitLog {
  id: string
  habit_id: string
  completed_at: string
}

interface HabitWithStats extends Habit {
  todayCompleted: boolean
  streak: number
  completionRate: number
  logs: HabitLog[]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithStats[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'custom',
    target_count: 1,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchHabits()
  }, [])

  async function fetchHabits() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (!habitsData) return

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    const habitsWithStats: HabitWithStats[] = habitsData.map((habit) => {
      const logs = logsData?.filter((l) => l.habit_id === habit.id) || []
      const todayStart = startOfDay(new Date())
      const todayCompleted = logs.some(
        (l) => new Date(l.completed_at) >= todayStart
      )

      // Calculate streak
      let streak = 0
      const sortedLogs = logs.sort((a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )

      if (sortedLogs.length > 0) {
        const uniqueDays = new Set<string>()
        sortedLogs.forEach(log => {
          const day = format(new Date(log.completed_at), 'yyyy-MM-dd')
          uniqueDays.add(day)
        })

        const days = Array.from(uniqueDays).sort().reverse()
        let currentDate = new Date()

        for (const day of days) {
          const logDate = new Date(day)
          const diff = differenceInDays(startOfDay(currentDate), startOfDay(logDate))

          if (diff <= 1) {
            streak++
            currentDate = logDate
          } else {
            break
          }
        }
      }

      // Calculate completion rate (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentLogs = logs.filter(
        (l) => new Date(l.completed_at) >= thirtyDaysAgo
      )
      const completionRate = habit.frequency === 'daily'
        ? Math.round((recentLogs.length / 30) * 100)
        : 0

      return {
        ...habit,
        todayCompleted,
        streak,
        completionRate,
        logs,
      }
    })

    setHabits(habitsWithStats)
  }

  async function createHabit() {
    if (!formData.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('habits').insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      frequency: formData.frequency,
      target_count: formData.target_count,
      active: true,
    })

    setFormData({ title: '', description: '', frequency: 'daily', target_count: 1 })
    setShowForm(false)
    fetchHabits()
  }

  async function logHabit(habitId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('habit_logs').insert({
      habit_id: habitId,
      user_id: user.id,
      completed_at: new Date().toISOString(),
    })

    fetchHabits()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Kebiasaan</h1>
          <p className="text-gray-600 mt-1">Bangun kebiasaan baik dengan streak tracking</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Kebiasaan Baru
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Buat Kebiasaan Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Olahraga 30 menit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frekuensi</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' | 'custom' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Count</label>
                <input
                  type="number"
                  min="1"
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createHabit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada kebiasaan. Mulai bangun kebiasaan baik!</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{habit.title}</h3>
                  {habit.description && (
                    <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                  )}
                </div>
                {habit.streak > 0 && (
                  <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded">
                    <FlameIcon className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-bold text-orange-600">{habit.streak}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completion Rate (30d)</span>
                    <span className="font-medium text-gray-900">{habit.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${habit.completionRate}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => logHabit(habit.id)}
                  disabled={habit.todayCompleted}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                    habit.todayCompleted
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {habit.todayCompleted ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Selesai Hari Ini
                    </>
                  ) : (
                    'Tandai Selesai'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
