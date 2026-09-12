'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Project {
  id: string
  title: string
  description: string | null
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  progress_percentage: number
  start_date: string | null
  target_date: string | null
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    target_date: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setProjects(data)
  }

  async function createProject() {
    if (!formData.title) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('projects').insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      start_date: formData.start_date || null,
      target_date: formData.target_date || null,
      status: 'planning',
      progress_percentage: 0,
    })

    setFormData({ title: '', description: '', start_date: '', target_date: '' })
    setShowForm(false)
    fetchProjects()
  }

  async function updateProjectStatus(id: string, status: Project['status']) {
    await supabase.from('projects').update({ status }).eq('id', id)
    fetchProjects()
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'neu-badge text-[var(--neu-text-muted)]'
      case 'active': return 'neu-badge text-[var(--neu-accent)]'
      case 'completed': return 'neu-badge text-[var(--neu-success-text)]'
      case 'on_hold': return 'neu-badge text-[var(--neu-warning-text)]'
    }
  }

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'Planning'
      case 'active': return 'Active'
      case 'completed': return 'Completed'
      case 'on_hold': return 'On Hold'
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--neu-text)]">Manajemen Project</h1>
          <p className="text-[var(--neu-text-muted)] mt-1">Kelola project Anda</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 neu-button"
        >
          <PlusIcon className="w-5 h-5" />
          Project Baru
        </button>
      </div>

      {showForm && (
        <div className="neu-card p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--neu-text)] mb-4">Buat Project Baru</h3>
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
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Mulai</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Target</label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createProject}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full neu-card p-12 text-center text-[var(--neu-text-muted)]">
            Belum ada project
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="neu-card p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-[var(--neu-text)] text-lg">{project.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-[var(--neu-text-muted)] mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--neu-text-muted)]">Progress</span>
                    <span className="font-medium text-[var(--neu-text)]">{project.progress_percentage}%</span>
                  </div>
                  <div className="neu-progress-track">
                    <div
                      className="neu-progress-fill transition-all"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {(project.start_date || project.target_date) && (
                  <div className="text-xs text-[var(--neu-text-muted)] space-y-1">
                    {project.start_date && (
                      <p>Mulai: {format(new Date(project.start_date), 'dd/MM/yyyy')}</p>
                    )}
                    {project.target_date && (
                      <p>Target: {format(new Date(project.target_date), 'dd/MM/yyyy')}</p>
                    )}
                  </div>
                )}

                <select
                  value={project.status}
                  onChange={(e) => updateProjectStatus(project.id, e.target.value as Project['status'])}
                  className="w-full px-3 py-2 text-sm neu-input"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
