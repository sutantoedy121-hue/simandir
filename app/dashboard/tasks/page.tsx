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
      case 1: return { text: 'Urgent & Important', color: 'neu-badge text-[var(--neu-danger-text)]' }
      case 2: return { text: 'Important', color: 'neu-badge text-[var(--neu-warning-text)]' }
      case 3: return { text: 'Urgent', color: 'neu-badge text-[var(--neu-warning-text)]' }
      default: return { text: 'Low Priority', color: 'neu-badge text-[var(--neu-text-muted)]' }
    }
  }

  const todoTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--neu-text)]">Manajemen Tugas</h1>
          <p className="text-[var(--neu-text-muted)] mt-1">Kelola tugas dengan Eisenhower Matrix</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 neu-button"
        >
          <PlusIcon className="w-5 h-5" />
          Tugas Baru
        </button>
      </div>

      {showForm && (
        <div className="neu-card p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--neu-text)] mb-4">Buat Tugas Baru</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 neu-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 neu-input"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">
                  Urgency (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">
                  Importance (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 neu-input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 neu-input"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createTask}
                className="px-4 py-2 neu-button"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 neu-button-secondary"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neu-card">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[var(--neu-text)]">To Do ({todoTasks.length})</h2>
          </div>
          <div className="space-y-3 pb-3">
            {todoTasks.length === 0 ? (
              <div className="p-6 text-center text-[var(--neu-text-muted)]">Tidak ada tugas</div>
            ) : (
              todoTasks.map((task) => {
                const priorityLabel = getPriorityLabel(task.priority)
                return (
                  <div key={task.id} className="neu-raised-sm p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(task)}
                        className="mt-1 neu-inset w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--neu-text)]">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-[var(--neu-text-muted)] mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${priorityLabel.color}`}>
                            {priorityLabel.text}
                          </span>
                          {task.deadline && (
                            <span className="text-xs text-[var(--neu-text-muted)]">
                              Due: {format(new Date(task.deadline), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-[var(--neu-danger)] hover:text-[var(--neu-danger-text)] flex-shrink-0"
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

        <div className="neu-card">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[var(--neu-text)]">Done ({doneTasks.length})</h2>
          </div>
          <div className="space-y-3 pb-3">
            {doneTasks.length === 0 ? (
              <div className="p-6 text-center text-[var(--neu-text-muted)]">Belum ada tugas selesai</div>
            ) : (
              doneTasks.map((task) => (
                <div key={task.id} className="neu-raised-sm p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className="mt-1 w-5 h-5 bg-[var(--neu-success)] rounded flex items-center justify-center flex-shrink-0"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--neu-text-muted)] line-through">{task.title}</h3>
                      {task.completed_at && (
                        <p className="text-xs text-[var(--neu-text-muted)] mt-1">
                          Selesai: {format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[var(--neu-danger)] hover:text-[var(--neu-danger-text)] flex-shrink-0"
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
