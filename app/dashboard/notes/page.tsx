'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, SearchIcon, TagIcon } from 'lucide-react'
import { format } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const supabase = createClient()

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes(query = '') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let queryBuilder = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }

    const { data } = await queryBuilder

    if (data) setNotes(data)
  }

  async function createNote() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: 'Catatan Baru',
        content: '',
      })
      .select()
      .single()

    if (data) {
      setNotes([data, ...notes])
      setSelectedNote(data)
      setEditForm({ title: data.title, content: data.content || '' })
      setIsEditing(true)
    }
  }

  async function updateNote() {
    if (!selectedNote) return

    await supabase
      .from('notes')
      .update({
        title: editForm.title,
        content: editForm.content,
      })
      .eq('id', selectedNote.id)

    setIsEditing(false)
    fetchNotes()
    setSelectedNote({ ...selectedNote, title: editForm.title, content: editForm.content })
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    if (selectedNote?.id === id) setSelectedNote(null)
    fetchNotes()
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    fetchNotes(query)
  }

  function selectNote(note: Note) {
    setSelectedNote(note)
    setEditForm({ title: note.title, content: note.content || '' })
    setIsEditing(false)
  }

  return (
    <div className="p-8 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--neu-text)]">Catatan</h1>
        <p className="text-[var(--neu-text-muted)] mt-1">Kelola pengetahuan & ide Anda</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-4 flex flex-col neu-card">
          <div className="p-4 space-y-3">
            <button
              onClick={createNote}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 neu-button"
            >
              <PlusIcon className="w-5 h-5" />
              Catatan Baru
            </button>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--neu-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari catatan..."
                className="w-full pl-10 pr-3 py-2 neu-input"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {notes.length === 0 ? (
              <div className="p-6 text-center text-[var(--neu-text-muted)] text-sm">
                Belum ada catatan
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`neu-raised-sm p-4 cursor-pointer ${
                    selectedNote?.id === note.id ? 'neu-inset' : ''
                  }`}
                >
                  <h3 className="font-medium text-[var(--neu-text)] truncate">{note.title}</h3>
                  <p className="text-sm text-[var(--neu-text-muted)] mt-1 line-clamp-2">
                    {note.content || 'Tidak ada konten'}
                  </p>
                  <p className="text-xs text-[var(--neu-text-muted)] mt-2">
                    {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-8 neu-card">
          {!selectedNote ? (
            <div className="h-full flex items-center justify-center text-[var(--neu-text-muted)]">
              Pilih atau buat catatan baru
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {isEditing ? (
                <div className="flex-1 flex flex-col p-6">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="text-2xl font-bold mb-4 px-3 py-2 neu-input"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="flex-1 px-3 py-2 neu-input"
                    placeholder="Tulis catatan Anda..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={updateNote}
                      className="px-4 py-2 neu-button"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 neu-button-secondary"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--neu-text)]">{selectedNote.title}</h2>
                      <p className="text-sm text-[var(--neu-text-muted)] mt-1">
                        Terakhir diubah: {format(new Date(selectedNote.updated_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 neu-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(selectedNote.id)}
                        className="px-4 py-2 neu-button-danger"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-[var(--neu-text)]">
                        {selectedNote.content || 'Tidak ada konten'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
