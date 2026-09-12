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
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Keuangan</h1>
          <p className="text-gray-600 mt-1">Lacak pemasukan & pengeluaran Anda</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Transaksi Baru
        </button>
      </div>

      {alert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{alert}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Rp {stats.balance.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Hari Ini</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            Rp {stats.todayExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Minggu Ini</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            Rp {stats.weekExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Bulan Ini (Keluar)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            Rp {stats.monthExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Bulan Ini (Masuk)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            Rp {stats.monthIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Transaksi Baru</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Makanan, Transport, Gaji"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createTransaction}
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

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Belum ada transaksi</div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUpIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDownIcon className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{transaction.category}</h3>
                      {transaction.description && (
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
