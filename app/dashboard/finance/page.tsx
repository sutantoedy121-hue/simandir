'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon } from 'lucide-react'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
}

interface Stats {
  balance: number
  todayExpense: number
  weekExpense: number
  monthExpense: number
  monthIncome: number
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats>({
    balance: 0,
    todayExpense: 0,
    weekExpense: 0,
    monthExpense: 0,
    monthIncome: 0,
  })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
  })
  const [alert, setAlert] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(50)

    if (data) {
      setTransactions(data)
      calculateStats(data)
    }
  }

  function calculateStats(transactions: Transaction[]) {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    let balance = 0
    let todayExpense = 0
    let weekExpense = 0
    let monthExpense = 0
    let monthIncome = 0

    transactions.forEach((t) => {
      const date = new Date(t.transaction_date)
      if (t.type === 'income') {
        balance += t.amount
        if (date >= monthStart) monthIncome += t.amount
      } else {
        balance -= t.amount
        if (date >= todayStart) todayExpense += t.amount
        if (date >= weekStart) weekExpense += t.amount
        if (date >= monthStart) monthExpense += t.amount
      }
    })

    setStats({ balance, todayExpense, weekExpense, monthExpense, monthIncome })

    // Alert boros: pengeluaran hari ini > 80% dari rata-rata harian bulanan
    if (monthIncome > 0) {
      const avgDailyBudget = monthIncome / 30
      const threshold = avgDailyBudget * 0.8
      if (todayExpense > threshold) {
        setAlert(
          `⚠️ Pengeluaran hari ini (Rp ${todayExpense.toLocaleString()}) melebihi 80% budget harian rata-rata (Rp ${threshold.toLocaleString()})`
        )
      } else {
        setAlert(null)
      }
    }
  }

  async function createTransaction() {
    if (!formData.amount || !formData.category) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description || null,
      transaction_date: new Date().toISOString(),
    })

    setFormData({ amount: '', type: 'expense', category: '', description: '' })
    setShowForm(false)
    fetchTransactions()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--neu-text)]">Manajemen Keuangan</h1>
          <p className="text-[var(--neu-text-muted)] mt-1">Lacak pemasukan & pengeluaran Anda</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 neu-button"
        >
          <PlusIcon className="w-5 h-5" />
          Transaksi Baru
        </button>
      </div>

      {alert && (
        <div className="neu-alert-error p-4 mb-6 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-[var(--neu-danger)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--neu-danger-text)]">{alert}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="neu-card p-4">
          <p className="text-sm text-[var(--neu-text-muted)]">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-[var(--neu-success)]' : 'text-[var(--neu-danger)]'}`}>
            Rp {stats.balance.toLocaleString()}
          </p>
        </div>
        <div className="neu-card p-4">
          <p className="text-sm text-[var(--neu-text-muted)]">Hari Ini</p>
          <p className="text-2xl font-bold text-[var(--neu-danger)] mt-1">
            Rp {stats.todayExpense.toLocaleString()}
          </p>
        </div>
        <div className="neu-card p-4">
          <p className="text-sm text-[var(--neu-text-muted)]">Minggu Ini</p>
          <p className="text-2xl font-bold text-[var(--neu-danger)] mt-1">
            Rp {stats.weekExpense.toLocaleString()}
          </p>
        </div>
        <div className="neu-card p-4">
          <p className="text-sm text-[var(--neu-text-muted)]">Bulan Ini (Keluar)</p>
          <p className="text-2xl font-bold text-[var(--neu-danger)] mt-1">
            Rp {stats.monthExpense.toLocaleString()}
          </p>
        </div>
        <div className="neu-card p-4">
          <p className="text-sm text-[var(--neu-text-muted)]">Bulan Ini (Masuk)</p>
          <p className="text-2xl font-bold text-[var(--neu-success)] mt-1">
            Rp {stats.monthIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="neu-card p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--neu-text)] mb-4">Transaksi Baru</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Tipe</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-3 py-2 neu-input"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 neu-input"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 neu-input"
                placeholder="Contoh: Makanan, Transport, Gaji"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--neu-text)] mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 neu-input"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createTransaction}
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

      <div className="neu-card">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--neu-text)]">Riwayat Transaksi</h2>
        </div>
        <div className="space-y-3 pb-3">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-[var(--neu-text-muted)]">Belum ada transaksi</div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="neu-raised-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${transaction.type === 'income' ? 'bg-[var(--neu-success)]/20' : 'bg-[var(--neu-danger)]/20'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUpIcon className="w-5 h-5 text-[var(--neu-success)]" />
                      ) : (
                        <TrendingDownIcon className="w-5 h-5 text-[var(--neu-danger)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--neu-text)]">{transaction.category}</h3>
                      {transaction.description && (
                        <p className="text-sm text-[var(--neu-text-muted)]">{transaction.description}</p>
                      )}
                      <p className="text-xs text-[var(--neu-text-muted)] mt-1">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-[var(--neu-success)]' : 'text-[var(--neu-danger)]'}`}>
                    {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
