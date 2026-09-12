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
    { value: 'great', label: '😊 Luar Biasa', color: 'text-[var(--neu-success)]' },
    { value: 'good', label: '🙂 Baik', color: 'text-[var(--neu-accent)]' },
    { value: 'okay', label: '😐 Biasa', color: 'text-yellow-600' },
    { value: 'bad', label: '😞 Buruk', color: 'text-[var(--neu-warning-text)]' },
    { value: 'terrible', label: '😢 Sangat Buruk', color: 'text-[var(--neu-danger)]' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--neu-text)]">Jurnal Harian</h1>
        <p className="text-[var(--neu-text-muted)] mt-1">Refleksi & catat perjalanan Anda</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 neu-card p-4">
          <h3 className="font-bold text-[var(--neu-text)] mb-4">Tanggal</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 neu-input"
          />

          <div className="mt-6">
            <h3 className="font-bold text-[var(--neu-text)] mb-3">Riwayat</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.entry_date)}
                  className={`w-full text-left neu-raised-sm p-3 ${
                    entry.entry_date === selectedDate ? 'neu-inset' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--neu-text)]">
                    {format(new Date(entry.entry_date), 'dd MMM yyyy')}
                  </p>
                  {entry.title && (
                    <p className="text-xs text-[var(--neu-text-muted)] mt-1 truncate">{entry.title}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-9 neu-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--neu-text)]">
              {format(new Date(selectedDate), 'dd MMMM yyyy')}
            </h2>
            {!isEditing && currentEntry && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 neu-button"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Judul (Opsional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                  placeholder="Judul jurnal hari ini"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Mood</label>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setFormData({ ...formData, mood: mood.value })}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        formData.mood === mood.value
                          ? 'neu-inset'
                          : 'neu-raised-sm'
                      }`}
                    >
                      <span className="text-2xl">{mood.label.split(' ')[0]}</span>
                      <p className="text-xs mt-1">{mood.label.split(' ')[1]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Isi Jurnal</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                  rows={15}
                  placeholder="Tuliskan refleksi Anda hari ini..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveEntry}
                  className="px-4 py-2 neu-button"
                >
                  Simpan
                </button>
                {currentEntry && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadEntryForDate(selectedDate)
                    }}
                    className="px-4 py-2 neu-button-secondary"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          ) : currentEntry ? (
            <div>
              {currentEntry.title && (
                <h3 className="text-xl font-bold text-[var(--neu-text)] mb-4">{currentEntry.title}</h3>
              )}
              {currentEntry.mood && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 neu-inset">
                    <span className="text-xl">
                      {moods.find((m) => m.value === currentEntry.mood)?.label.split(' ')[0]}
                    </span>
                    <span className="text-sm font-medium text-[var(--neu-text)]">
                      {moods.find((m) => m.value === currentEntry.mood)?.label.split(' ')[1]}
                    </span>
                  </span>
                </div>
              )}
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-[var(--neu-text)]">{currentEntry.content}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-[var(--neu-text-muted)] py-12">
              Belum ada jurnal untuk tanggal ini
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
