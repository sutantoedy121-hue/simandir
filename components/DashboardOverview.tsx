'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarIcon, CheckSquareIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react'

interface Stats {
  todayActivities: number
  pendingTasks: number
  todayExpenses: number
  activeHabits: number
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    todayActivities: 0,
    pendingTasks: 0,
    todayExpenses: 0,
    activeHabits: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [activities, tasks, transactions, habits] = await Promise.all([
        supabase
          .from('activities')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_time', today.toISOString()),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'done'),
        supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('transaction_date', today.toISOString()),
        supabase
          .from('habits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('active', true),
      ])

      setStats({
        todayActivities: activities.count || 0,
        pendingTasks: tasks.count || 0,
        todayExpenses: transactions.count || 0,
        activeHabits: habits.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return <div className="text-gray-600">Loading...</div>
  }

  const cards = [
    {
      title: 'Aktivitas Hari Ini',
      value: stats.todayActivities,
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Tugas Pending',
      value: stats.pendingTasks,
      icon: CheckSquareIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Pengeluaran Hari Ini',
      value: stats.todayExpenses,
      icon: DollarSignIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Kebiasaan Aktif',
      value: stats.activeHabits,
      icon: TrendingUpIcon,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
