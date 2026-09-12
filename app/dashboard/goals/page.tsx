'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, TargetIcon, TrendingUpIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Goal {
  id: string
  title: string
  description: string | null
  target_date: string | null
  status: 'active' | 'completed' | 'abandoned'
  progress_percentage: number
}

interface Milestone {
  id: string
  goal_id: string
  title: string
  description: string | null
  target_date: string | null
  completed: boolean
  completed_at: string | null
}

interface GoalWithMilestones extends Goal {
  milestones: Milestone[]
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithMilestones[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target_date: '',
  })
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    target_date: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!goalsData) return

    const { data: milestonesData } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('target_date', { ascending: true })

    const goalsWithMilestones: GoalWithMilestones[] = goalsData.map((goal) => ({
      ...goal,
      milestones: milestonesData?.filter((m) => m.goal_id === goal.id) || [],
    }))

    setGoals(goalsWithMilestones)
  }

  async function createGoal() {
    if (!goalForm.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('goals').insert({
      user_id: user.id,
      title: goalForm.title,
      description: goalForm.description || null,
      target_date: goalForm.target_date || null,
      status: 'active',
      progress_percentage: 0,
    })

    setGoalForm({ title: '', description: '', target_date: '' })
    setShowGoalForm(false)
    fetchGoals()
  }

  async function createMilestone(goalId: string) {
    if (!milestoneForm.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('milestones').insert({
      goal_id: goalId,
      user_id: user.id,
      title: milestoneForm.title,
      description: milestoneForm.description || null,
      target_date: milestoneForm.target_date || null,
      completed: false,
    })

    setMilestoneForm({ title: '', description: '', target_date: '' })
    setShowMilestoneForm(null)
    fetchGoals()
  }

  async function toggleMilestone(milestone: Milestone, goalId: string) {
    await supabase
      .from('milestones')
      .update({
        completed: !milestone.completed,
        completed_at: !milestone.completed ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id)

    // Update goal progress
    const goal = goals.find((g) => g.id === goalId)
    if (goal) {
      const totalMilestones = goal.milestones.length
      const completedMilestones = goal.milestones.filter((m) =>
        m.id === milestone.id ? !milestone.completed : m.completed
      ).length
      const progress = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0

      await supabase
        .from('goals')
        .update({
          progress_percentage: progress,
          status: progress === 100 ? 'completed' : 'active'
        })
        .eq('id', goalId)
    }

    fetchGoals()
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Target & Goals</h1>
          <p className="text-gray-600 mt-1">Tetapkan dan capai target jangka panjang Anda</p>
        </div>
        <button
          onClick={() => setShowGoalForm(!showGoalForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Goal Baru
        </button>
      </div>

      {showGoalForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Buat Goal Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input
                type="text"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Lulus Sertifikasi AWS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
              <input
                type="date"
                value={goalForm.target_date}
                onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Goals ({activeGoals.length})</h2>
          <div className="space-y-4">
            {activeGoals.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
                Belum ada goal aktif
              </div>
            ) : (
              activeGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TargetIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">{goal.title}</h3>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
                      )}
                      {goal.target_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Target: {format(new Date(goal.target_date), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded">
                      <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-600">
                        {goal.progress_percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        Milestones ({goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length})
                      </h4>
                      <button
                        onClick={() => setShowMilestoneForm(showMilestoneForm === goal.id ? null : goal.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Tambah Milestone
                      </button>
                    </div>

                    {showMilestoneForm === goal.id && (
                      <div className="bg-gray-50 rounded p-4 space-y-3">
                        <input
                          type="text"
                          value={milestoneForm.title}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Milestone title"
                        />
                        <input
                          type="date"
                          value={milestoneForm.target_date}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, target_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => createMilestone(goal.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setShowMilestoneForm(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {goal.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <button
                          onClick={() => toggleMilestone(milestone, goal.id)}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            milestone.completed
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300 hover:border-blue-600'
                          }`}
                        >
                          {milestone.completed && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {milestone.title}
                          </p>
                          {milestone.target_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(milestone.target_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Goals ({completedGoals.length})</h2>
            <div className="space-y-4">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <div className="flex items-center gap-2">
                    <TargetIcon className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-bold text-green-900">{goal.title}</h3>
                    <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
