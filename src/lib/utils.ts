import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function formatCurrency(amount: number, currency = 'TWD'): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}

function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayISO(): string {
  return localDateISO(new Date())
}

export function getStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  const set = new Set(completions)
  const today = todayISO()

  // Allow streak if today not yet checked off — start counting from yesterday
  let check = today
  if (!set.has(today)) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    check = localDateISO(yesterday)
    if (!set.has(check)) return 0
  }

  let streak = 0
  while (set.has(check)) {
    streak++
    const parts = check.split('-').map(Number)
    const prev = new Date(parts[0], parts[1] - 1, parts[2])
    prev.setDate(prev.getDate() - 1)
    check = localDateISO(prev)
  }
  return streak
}
