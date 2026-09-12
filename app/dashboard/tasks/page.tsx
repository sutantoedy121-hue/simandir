'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, CheckIcon, TrashIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: number
  urgency: number
  importance: number
  deadline: string | null
  completed_at: string | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 3,
    importance: 3,
    deadline: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setTasks(data)
  }

  async function createTask() {
    if (!formData.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Calculate priority (Eisenhower Matrix)
    // 1 = urgent + important, 2 = important not urgent, 3 = urgent not important, 4 = neither
    let priority = 4
    if (formData.urgency >= 4 && formData.importance >= 4) priority = 1
    else if (formData.importance >= 4) priority = 2
    else if (formData.urgency >= 4) priority = 3

    await supabase.from('tasks').insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      urgency: formData.urgency,
      importance: formData.importance,
      priority,
      deadline: formData.deadline || null,
      status: 'todo',
    })

    setFormData({ title: '', description: '', urgency: 3, importance: 3, deadline: '' })
    setShowForm(false)
    fetchTasks()
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    fetchTasks()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { text: 'Urgent & Important', color: 'bg-red-100 text-red-800' }
      case 2: return { text: 'Important', color: 'bg-yellow-100 text-yellow-800' }
      case 3: return { text: 'Urgent', color: 'bg-orange-100 text-orange-800' }
      default: return { text: 'Low Priority', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const todoTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Tugas</h1>
          <p className="text-gray-600 mt-1">Kelola tugas dengan Eisenhower Matrix</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Tugas Baru
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Buat Tugas Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importance (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createTask}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">To Do ({todoTasks.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {todoTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Tidak ada tugas</div>
            ) : (
              todoTasks.map((task) => {
                const priorityLabel = getPriorityLabel(task.priority)
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(task)}
                        className="mt-1 w-5 h-5 border-2 border-gray-300 rounded hover:border-blue-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${priorityLabel.color}`}>
                            {priorityLabel.text}
                          </span>
                          {task.deadline && (
                            <span className="text-xs text-gray-500">
                              Due: {format(new Date(task.deadline), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Done ({doneTasks.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {doneTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Belum ada tugas selesai</div>
            ) : (
              doneTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className="mt-1 w-5 h-5 bg-green-600 rounded flex items-center justify-center flex-shrink-0"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-500 line-through">{task.title}</h3>
                      {task.completed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Selesai: {format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 flex-shrink-0"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
