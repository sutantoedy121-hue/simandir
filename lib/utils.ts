// Utility functions for date/time operations
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns'

export function getDateRange(period: 'day' | 'week' | 'month', date: Date = new Date()) {
  switch (period) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      }
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      }
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} menit`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`
}

export function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  const sortedDates = dates
    .map(d => format(startOfDay(d), 'yyyy-MM-dd'))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse()

  let streak = 0
  let currentDate = new Date()

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr)
    const daysDiff = Math.floor(
      (startOfDay(currentDate).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysDiff <= 1) {
      streak++
      currentDate = date
    } else {
      break
    }
  }

  return streak
}

export function getEisenhowerQuadrant(urgency: number, importance: number): {
  quadrant: 1 | 2 | 3 | 4
  label: string
  color: string
} {
  if (urgency >= 4 && importance >= 4) {
    return { quadrant: 1, label: 'Do First (Urgent & Important)', color: 'red' }
  } else if (importance >= 4) {
    return { quadrant: 2, label: 'Schedule (Important)', color: 'yellow' }
  } else if (urgency >= 4) {
    return { quadrant: 3, label: 'Delegate (Urgent)', color: 'orange' }
  } else {
    return { quadrant: 4, label: 'Eliminate (Neither)', color: 'gray' }
  }
}
