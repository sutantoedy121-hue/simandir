'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SendIcon, BotIcon, UserIcon } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchMessages() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) setMessages(data)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const userMessage = input
    setInput('')
    setLoading(true)

    // Save user message
    const { data: userMsg } = await supabase
      .from('ai_chat_history')
      .insert({
        user_id: user.id,
        role: 'user',
        content: userMessage,
      })
      .select()
      .single()

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg])
    }

    try {
      // Call AI API (ponytail: real AI integration - add when budget allows)
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const { reply } = await response.json()

      // Save AI response
      const { data: aiMsg } = await supabase
        .from('ai_chat_history')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: reply,
        })
        .select()
        .single()

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch (error) {
      console.error('AI error:', error)
      const errorMsg = {
        id: Date.now().toString(),
        user_id: user.id,
        role: 'assistant' as const,
        content: 'Maaf, AI assistant belum tersedia. Fitur ini memerlukan API key.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    }

    setLoading(false)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="p-6 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600 mt-1">Tanya apa saja tentang data Anda</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <BotIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Mulai percakapan dengan AI Assistant</p>
            <p className="text-sm mt-2">Tanya tentang aktivitas, keuangan, atau goal Anda</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-2xl px-4 py-3 rounded-lg bg-white border border-gray-200">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <SendIcon className="w-5 h-5" />
            Kirim
          </button>
        </div>
      </div>
    </div>
  )
}
