export interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  completions: string[] // ISO date strings
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  target: number
  current: number
  unit: string
  deadline?: string
  category: 'weekly' | 'monthly' | 'long-term'
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
}

export type ExpenseCategory =
  | '餐飲'
  | '交通'
  | '娛樂'
  | '購物'
  | '醫療'
  | '教育'
  | '居住'
  | '其他'

export interface Budget {
  category: ExpenseCategory
  limit: number
}

export interface Investment {
  id: string
  symbol: string
  name: string
  shares: number
  avgCost: number
  currency: 'TWD' | 'USD'
}

export interface Article {
  id: string
  url: string
  title: string
  description?: string
  tags: string[]
  saved: boolean
  createdAt: string
}

export interface WatchlistItem {
  symbol: string
  type: 'stock' | 'crypto'
}

export type JournalSource = 'JAMA' | 'NEJM' | 'Lancet' | 'BMJ' | 'Nature Medicine' | 'Other'

export interface MedicalPaper {
  id: string
  title: string
  authors: string[]
  journal: string
  journalSource: JournalSource
  year: number
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  pmid?: string
  url?: string
  abstract?: string
  tags: string[]
  notes?: string
  createdAt: string
}
