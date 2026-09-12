export interface Activity {
  id: string
  userId: string
  title: string
  description?: string
  category: string
  type: 'positive' | 'negative' | 'neutral'
  startTime: Date
  endTime?: Date
  durationMinutes?: number
  lifeCategoryId?: string
}

export interface Event {
  id: string
  userId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  reminderMinutes?: number
  lifeCategoryId?: string
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: number
  urgency: number
  importance: number
  deadline?: Date
  completedAt?: Date
  lifeCategoryId?: string
  projectId?: string
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description?: string
  transactionDate: Date
  lifeCategoryId?: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  limitAmount: number
  period: 'daily' | 'weekly' | 'monthly'
  startDate: Date
  endDate?: Date
  lifeCategoryId?: string
}

export interface Habit {
  id: string
  userId: string
  title: string
  description?: string
  frequency: 'daily' | 'weekly' | 'custom'
  targetCount: number
  lifeCategoryId?: string
  active: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  userId: string
  completedAt: Date
  note?: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  targetDate?: Date
  status: 'active' | 'completed' | 'abandoned'
  progressPercentage: number
  lifeCategoryId?: string
}

export interface LifeCategory {
  id: string
  name: string
  color: string
  icon?: string
}
