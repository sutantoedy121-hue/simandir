'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface JournalEntry {
  id: string
  title: string | null
  content: string
  entry_date: string
  mood: string | null
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    loadEntryForDate(selectedDate)
  }, [selectedDate, entries])

  async function fetchEntries() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (data) setEntries(data)
  }

  function loadEntryForDate(date: string) {
    const entry = entries.find((e) => e.entry_date === date)
    if (entry) {
      setCurrentEntry(entry)
      setFormData({
        title: entry.title || '',
        content: entry.content,
        mood: entry.mood || '',
      })
      setIsEditing(false)
    } else {
      setCurrentEntry(null)
      setFormData({ title: '', content: '', mood: '' })
      setIsEditing(true)
    }
  }

  async function saveEntry() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (currentEntry) {
      await supabase
        .from('journal_entries')
        .update({
          title: formData.title || null,
          content: formData.content,
          mood: formData.mood || null,
        })
        .eq('id', currentEntry.id)
    } else {
      await supabase.from('journal_entries').insert({
        user_id: user.id,
        title: formData.title || null,
        content: formData.content,
        entry_date: selectedDate,
        mood: formData.mood || null,
      })
    }

    setIsEditing(false)
    fetchEntries()
  }

  const moods = [
    { value: 'great', label: '😊 Luar Biasa', color: 'text-green-600' },
    { value: 'good', label: '🙂 Baik', color: 'text-blue-600' },
    { value: 'okay', label: '😐 Biasa', color: 'text-yellow-600' },
    { value: 'bad', label: '😞 Buruk', color: 'text-orange-600' },
    { value: 'terrible', label: '😢 Sangat Buruk', color: 'text-red-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jurnal Harian</h1>
        <p className="text-gray-600 mt-1">Refleksi & catat perjalanan Anda</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white rounded-lg shadow border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">Tanggal</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-6">
            <h3 className="font-bold text-gray-900 mb-3">Riwayat</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.entry_date)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 ${
                    entry.entry_date === selectedDate ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(entry.entry_date), 'dd MMM yyyy')}
                  </p>
                  {entry.title && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{entry.title}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-9 bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {format(new Date(selectedDate), 'dd MMMM yyyy')}
            </h2>
            {!isEditing && currentEntry && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul (Opsional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Judul jurnal hari ini"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setFormData({ ...formData, mood: mood.value })}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        formData.mood === mood.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl">{mood.label.split(' ')[0]}</span>
                      <p className="text-xs mt-1">{mood.label.split(' ')[1]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Jurnal</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={15}
                  placeholder="Tuliskan refleksi Anda hari ini..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveEntry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
                {currentEntry && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadEntryForDate(selectedDate)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          ) : currentEntry ? (
            <div>
              {currentEntry.title && (
                <h3 className="text-xl font-bold text-gray-900 mb-4">{currentEntry.title}</h3>
              )}
              {currentEntry.mood && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                    <span className="text-xl">
                      {moods.find((m) => m.value === currentEntry.mood)?.label.split(' ')[0]}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {moods.find((m) => m.value === currentEntry.mood)?.label.split(' ')[1]}
                    </span>
                  </span>
                </div>
              )}
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{currentEntry.content}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Belum ada jurnal untuk tanggal ini
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
