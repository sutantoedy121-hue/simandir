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
        <h1 className="text-3xl font-bold text-gray-900">Catatan</h1>
        <p className="text-gray-600 mt-1">Kelola pengetahuan & ide Anda</p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-4 flex flex-col bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <button
              onClick={createNote}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Catatan Baru
            </button>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari catatan..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
            {notes.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Belum ada catatan
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedNote?.id === note.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {note.content || 'Tidak ada konten'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(note.updated_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-8 bg-white rounded-lg shadow border border-gray-200">
          {!selectedNote ? (
            <div className="h-full flex items-center justify-center text-gray-500">
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
                    className="text-2xl font-bold mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tulis catatan Anda..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={updateNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedNote.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Terakhir diubah: {format(new Date(selectedNote.updated_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(selectedNote.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">
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
